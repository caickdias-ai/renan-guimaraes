-- Modelo de dados seguro para o Gestao de Alunos.
-- Execute no SQL Editor do Supabase após 001_rls_and_indexes.sql.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('trainer','client')),
  name text,
  created_at timestamptz not null default now()
);

alter table public.clients add column if not exists sex text;
alter table public.clients add column if not exists height_cm numeric;
alter table public.clients add column if not exists weight_kg numeric;
alter table public.clients add column if not exists birth_date date;
alter table public.clients add column if not exists notes text;
alter table public.clients drop constraint if exists clients_status_check;
alter table public.clients add constraint clients_status_check check (status in ('invited','pending_review','active','inactive'));

create table if not exists public.client_invites (
  id uuid primary key default gen_random_uuid(), token text not null unique check (length(token) = 32),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_name_hint text, phone_hint text,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists public.anamnesis_templates (
  id uuid primary key default gen_random_uuid(), trainer_id uuid not null references public.profiles(id) on delete cascade,
  questions jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.anamneses add column if not exists answers jsonb not null default '{}'::jsonb;
alter table public.anamneses add column if not exists consent_at timestamptz;
alter table public.anamneses add column if not exists version integer not null default 1;

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(), trainer_id uuid references public.profiles(id) on delete cascade,
  name text not null, muscle_group text, equipment text, video_url text, created_at timestamptz not null default now()
);

alter table public.workouts add column if not exists goal text;
alter table public.workouts add column if not exists is_template boolean not null default false;
alter table public.workouts add column if not exists starts_on date;
alter table public.workouts add column if not exists ends_on date;
create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(), workout_id uuid not null references public.workouts(id) on delete cascade,
  name text not null, position integer not null default 0
);
create table if not exists public.workout_items (
  id uuid primary key default gen_random_uuid(), day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id), sets integer, reps text, rest_seconds integer, notes text, position integer not null default 0
);

alter table public.nutrition_plans add column if not exists protein_g numeric;
alter table public.nutrition_plans add column if not exists carbs_g numeric;
alter table public.nutrition_plans add column if not exists fat_g numeric;
alter table public.nutrition_plans add column if not exists is_template boolean not null default false;
alter table public.nutrition_plans add column if not exists responsible_professional text;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(), trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade, title text not null,
  type text not null default 'outro' check (type in ('treino','avaliacao','consulta','outro')),
  starts_at timestamptz not null, ends_at timestamptz, status text not null default 'scheduled' check (status in ('scheduled','done','canceled','no_show')),
  notes text, series_id uuid, created_at timestamptz not null default now()
);
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  date date not null default current_date, weight_kg numeric, body_fat_pct numeric, measures jsonb not null default '{}'::jsonb
);

insert into public.exercises (trainer_id, name, muscle_group, equipment)
select null, v.name, v.muscle_group, v.equipment from (values
('Agachamento livre','Pernas','Barra'),('Leg press 45°','Pernas','Leg press'),('Cadeira extensora','Quadríceps','Máquina'),('Mesa flexora','Posterior','Máquina'),('Stiff','Posterior','Barra'),('Elevação pélvica','Glúteos','Barra'),('Afundo','Pernas','Halteres'),('Panturrilha em pé','Panturrilhas','Máquina'),('Supino reto','Peito','Barra'),('Supino inclinado','Peito','Halteres'),('Crucifixo','Peito','Halteres'),('Crossover','Peito','Polia'),('Flexão de braço','Peito','Peso corporal'),('Puxada frontal','Costas','Polia'),('Barra fixa','Costas','Barra'),('Remada baixa','Costas','Polia'),('Remada curvada','Costas','Barra'),('Remada unilateral','Costas','Halter'),('Pullover','Costas','Polia'),('Desenvolvimento','Ombros','Halteres'),('Elevação lateral','Ombros','Halteres'),('Elevação frontal','Ombros','Halteres'),('Face pull','Ombros','Polia'),('Rosca direta','Bíceps','Barra'),('Rosca alternada','Bíceps','Halteres'),('Rosca martelo','Bíceps','Halteres'),('Tríceps pulley','Tríceps','Polia'),('Tríceps francês','Tríceps','Halter'),('Tríceps testa','Tríceps','Barra'),('Abdominal infra','Core','Peso corporal'),('Prancha','Core','Peso corporal'),('Abdominal na polia','Core','Polia'),('Esteira','Cardio','Esteira'),('Bicicleta ergométrica','Cardio','Bicicleta'),('Elíptico','Cardio','Elíptico')) v(name,muscle_group,equipment)
where not exists (select 1 from public.exercises e where e.trainer_id is null and e.name = v.name);

alter table public.profiles enable row level security;
alter table public.client_invites enable row level security;
alter table public.anamnesis_templates enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_items enable row level security;
alter table public.appointments enable row level security;
alter table public.body_measurements enable row level security;

-- Policies usam profiles, nunca user_metadata, para autorizar trainers.
create or replace function public.is_trainer() returns boolean language sql stable security invoker set search_path = public as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'trainer') $$;

create policy profiles_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy invites_trainer on public.client_invites for all to authenticated using (trainer_id = (select auth.uid()) and public.is_trainer()) with check (trainer_id = (select auth.uid()) and public.is_trainer());
create policy templates_trainer on public.anamnesis_templates for all to authenticated using (trainer_id = (select auth.uid()) and public.is_trainer()) with check (trainer_id = (select auth.uid()) and public.is_trainer());
create policy exercises_read on public.exercises for select to authenticated using (trainer_id is null or trainer_id = (select auth.uid()));
create policy exercises_write on public.exercises for all to authenticated using (trainer_id = (select auth.uid()) and public.is_trainer()) with check (trainer_id = (select auth.uid()) and public.is_trainer());
create policy appointments_trainer on public.appointments for all to authenticated using (trainer_id = (select auth.uid())) with check (trainer_id = (select auth.uid()));
create policy measurements_trainer on public.body_measurements for all to authenticated using (exists (select 1 from public.clients c where c.id = client_id and c.trainer_id = (select auth.uid()))) with check (exists (select 1 from public.clients c where c.id = client_id and c.trainer_id = (select auth.uid())));
create policy workout_days_trainer on public.workout_days for all to authenticated using (exists (select 1 from public.workouts w where w.id = workout_id and w.trainer_id = (select auth.uid()))) with check (exists (select 1 from public.workouts w where w.id = workout_id and w.trainer_id = (select auth.uid())));
create policy workout_items_trainer on public.workout_items for all to authenticated using (exists (select 1 from public.workout_days d join public.workouts w on w.id = d.workout_id where d.id = day_id and w.trainer_id = (select auth.uid()))) with check (exists (select 1 from public.workout_days d join public.workouts w on w.id = d.workout_id where d.id = day_id and w.trainer_id = (select auth.uid())));

insert into storage.buckets (id, name, public) values ('client-photos', 'client-photos', false) on conflict (id) do update set public = false;
create policy client_photos_select on storage.objects for select to authenticated using (bucket_id = 'client-photos' and exists (select 1 from public.clients c where c.trainer_id = (select auth.uid()) and position(c.id::text in name) > 0));
create policy client_photos_insert on storage.objects for insert to authenticated with check (bucket_id = 'client-photos' and public.is_trainer());

create index if not exists client_invites_trainer_id_idx on public.client_invites(trainer_id);
create index if not exists appointments_trainer_starts_idx on public.appointments(trainer_id, starts_at);
create index if not exists body_measurements_client_date_idx on public.body_measurements(client_id, date desc);
create index if not exists workout_days_workout_position_idx on public.workout_days(workout_id, position);
create index if not exists workout_items_day_position_idx on public.workout_items(day_id, position);
