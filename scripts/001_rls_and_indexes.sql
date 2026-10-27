-- Execute no Supabase SQL Editor.
-- Garante RLS e índices básicos para o escopo por personal.
alter table if exists public.clients enable row level security;
alter table if exists public.anamneses enable row level security;
alter table if exists public.workouts enable row level security;
alter table if exists public.nutrition_plans enable row level security;
create index if not exists clients_trainer_id_idx on public.clients(trainer_id);
create index if not exists anamneses_client_id_idx on public.anamneses(client_id);
create index if not exists workouts_client_id_idx on public.workouts(client_id);
create index if not exists nutrition_plans_client_id_idx on public.nutrition_plans(client_id);
