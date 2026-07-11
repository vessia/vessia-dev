-- 002_profiles_insert_policy.sql
-- Vessia — corrige lacuna do schema inicial: 001 habilitou RLS em `profiles`
-- e criou políticas de leitura/update, mas nenhuma de insert. Sem isso,
-- nenhuma linha pode ser criada em `profiles` por um client autenticado
-- (RLS bloqueia por padrão). Necessário para a tarefa 6 do Bloco 2
-- (cadastro cria a linha em profiles).

create policy "profiles: self insert" on profiles for insert
  with check (auth.uid() = id);
