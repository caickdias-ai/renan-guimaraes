-- PT Manager: rode no SQL Editor do Supabase.
create table profiles (id uuid primary key references auth.users on delete cascade, role text not null default 'aluno' check (role in ('professor','aluno')), nome text);
create table planos (id uuid primary key default gen_random_uuid(), professor_id uuid not null references profiles, nome text not null, valor numeric default 0);
create table alunos (id uuid primary key default gen_random_uuid(), professor_id uuid not null references profiles, user_id uuid references auth.users, nome text not null, telefone text, nascimento text, objetivo text, plano_id uuid references planos, criado_em timestamptz default now());
create table convites (token uuid primary key default gen_random_uuid(), professor_id uuid not null references profiles, tipo text not null check (tipo in ('cadastro','anamnese')), aluno_id uuid references alunos, usado boolean default false);
create table exercicios (id uuid primary key default gen_random_uuid(), professor_id uuid references profiles, nome text not null, grupo text not null, video_url text); -- professor_id nulo = biblioteca global
create table treinos (id uuid primary key default gen_random_uuid(), aluno_id uuid not null references alunos on delete cascade, nome text not null, ordem int default 0);
create table treino_itens (id uuid primary key default gen_random_uuid(), treino_id uuid not null references treinos on delete cascade, exercicio_id uuid not null references exercicios, series int default 3, reps text default '12');
create table dietas (aluno_id uuid primary key references alunos on delete cascade, refeicoes jsonb not null default '[]');
create table anamnese_modelos (professor_id uuid primary key references profiles, perguntas jsonb not null default '[]');
create table anamnese_respostas (id uuid primary key default gen_random_uuid(), aluno_id uuid not null references alunos on delete cascade, respostas jsonb not null, criado_em timestamptz default now());
create table medidas (id uuid primary key default gen_random_uuid(), aluno_id uuid not null references alunos on delete cascade, data date default current_date, tipo text not null, valor numeric not null);
create table cargas (id uuid primary key default gen_random_uuid(), aluno_id uuid not null references alunos on delete cascade, exercicio_id uuid not null references exercicios, data date default current_date, kg numeric not null, criado_em timestamptz default now());
create table feedbacks (id uuid primary key default gen_random_uuid(), aluno_id uuid not null references alunos on delete cascade, treino_id uuid references treinos, nivel int check (nivel between 1 and 5), mensagem text, criado_em timestamptz default now());
create table mensagens (id uuid primary key default gen_random_uuid(), aluno_id uuid not null references alunos on delete cascade, de text not null check (de in ('professor','aluno')), texto text not null, criado_em timestamptz default now());

-- Segurança: professor vê os seus alunos; aluno vê só os próprios dados.
create function acesso_aluno(a uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from alunos where id = a and (professor_id = auth.uid() or user_id = auth.uid())) $$;

do $$ declare t text; begin
  foreach t in array array['treinos','dietas','anamnese_respostas','medidas','cargas','feedbacks','mensagens'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy acesso on %I for all using (acesso_aluno(aluno_id)) with check (acesso_aluno(aluno_id))', t);
  end loop;
end $$;

alter table profiles enable row level security;       create policy p on profiles for select using (id = auth.uid());
alter table alunos enable row level security;         create policy p on alunos for all using (professor_id = auth.uid() or user_id = auth.uid()) with check (professor_id = auth.uid());
alter table planos enable row level security;         create policy p on planos for all using (professor_id = auth.uid()) with check (professor_id = auth.uid());
alter table convites enable row level security;       create policy p on convites for all using (professor_id = auth.uid()) with check (professor_id = auth.uid());
alter table anamnese_modelos enable row level security; create policy p on anamnese_modelos for all using (professor_id = auth.uid()) with check (professor_id = auth.uid());
alter table exercicios enable row level security;     create policy p on exercicios for select using (professor_id is null or professor_id = auth.uid() or exists (select 1 from alunos where user_id = auth.uid()));
create policy w on exercicios for all using (professor_id = auth.uid()) with check (professor_id = auth.uid());
alter table treino_itens enable row level security;   create policy p on treino_itens for all using (exists (select 1 from treinos t where t.id = treino_id and acesso_aluno(t.aluno_id))) with check (exists (select 1 from treinos t where t.id = treino_id and acesso_aluno(t.aluno_id)));

-- Cadastro por link: cria o aluno vinculado ao professor dono do convite.
create function cadastrar_por_convite(p_token uuid, p_dados jsonb) returns void language plpgsql security definer set search_path = public as $$
declare c convites; begin
  select * into c from convites where token = p_token and tipo = 'cadastro' and not usado;
  if not found then raise exception 'Convite inválido ou já usado'; end if;
  insert into profiles (id, role, nome) values (auth.uid(), 'aluno', p_dados->>'nome') on conflict do nothing;
  insert into alunos (professor_id, user_id, nome, telefone, nascimento, objetivo)
  values (c.professor_id, auth.uid(), p_dados->>'nome', p_dados->>'telefone', p_dados->>'nascimento', p_dados->>'objetivo');
  update convites set usado = true where token = p_token;
end $$;

-- Tornar-se professor: após criar sua conta, rode: update profiles set role='professor' where id='SEU-UUID';
-- (e insira seu profile: insert into profiles (id, role, nome) values ('SEU-UUID','professor','Seu Nome');)

-- Biblioteca inicial de exercícios (links de vídeo: troque pelos seus)
insert into exercicios (nome, grupo) values
('Agachamento livre','Pernas'),('Leg press 45','Pernas'),('Cadeira extensora','Pernas'),('Mesa flexora','Pernas'),('Afundo','Pernas'),('Stiff','Pernas'),
('Elevação pélvica','Glúteos'),('Cadeira abdutora','Glúteos'),('Glúteo na polia','Glúteos'),('Agachamento sumô','Glúteos'),
('Supino reto','Peito'),('Supino inclinado','Peito'),('Crucifixo','Peito'),('Flexão de braço','Peito'),
('Puxada frontal','Costas'),('Remada curvada','Costas'),('Remada baixa','Costas'),('Pulldown','Costas'),
('Desenvolvimento','Ombros'),('Elevação lateral','Ombros'),('Elevação frontal','Ombros'),
('Rosca direta','Bíceps'),('Rosca martelo','Bíceps'),('Tríceps corda','Tríceps'),('Tríceps testa','Tríceps'),('Prancha','Core'),('Abdominal infra','Core');

-- Chat em tempo real: habilita eventos de INSERT na tabela de mensagens.
alter publication supabase_realtime add table mensagens;

-- Anamnese por link: o aluno logado abre o convite, lê as perguntas e responde.
create function obter_anamnese(p_token uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare c convites; begin
  select * into c from convites where token = p_token and tipo = 'anamnese' and not usado;
  if not found then raise exception 'Convite inválido ou já respondido'; end if;
  if not exists (select 1 from alunos where id = c.aluno_id and user_id = auth.uid()) then raise exception 'Este convite é de outro aluno'; end if;
  return coalesce((select perguntas from anamnese_modelos where professor_id = c.professor_id), '[]'::jsonb);
end $$;

create function responder_anamnese(p_token uuid, p_respostas jsonb) returns void language plpgsql security definer set search_path = public as $$
declare c convites; begin
  select * into c from convites where token = p_token and tipo = 'anamnese' and not usado;
  if not found then raise exception 'Convite inválido ou já respondido'; end if;
  if not exists (select 1 from alunos where id = c.aluno_id and user_id = auth.uid()) then raise exception 'Este convite é de outro aluno'; end if;
  insert into anamnese_respostas (aluno_id, respostas) values (c.aluno_id, p_respostas);
  update convites set usado = true where token = p_token;
end $$;
