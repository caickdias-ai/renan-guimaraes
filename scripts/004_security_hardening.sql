create unique index if not exists anamneses_client_id_key on public.anamneses(client_id);

do $$ declare table_name text; begin
  foreach table_name in array array['clients','anamneses','workouts','nutrition_plans'] loop
    execute format('drop policy if exists trainer_owner on public.%I', table_name);
    execute format('create policy trainer_owner on public.%I for all to authenticated using (trainer_id = (select auth.uid()) and public.is_trainer()) with check (trainer_id = (select auth.uid()) and public.is_trainer())', table_name);
  end loop;
end $$;
