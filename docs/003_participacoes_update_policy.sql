-- 003_participacoes_update_policy.sql
-- Vessia — corrige lacuna do schema inicial: 001 habilitou RLS em
-- `participacoes` e criou políticas de leitura/insert, mas nenhuma de
-- update. Sem isso, o aluno não consegue mover a própria Participação para
-- 'em_aprovacao' ao enviar uma Entrega (Bloco 8, tarefa 25) — RLS bloqueia
-- por padrão. Mesmo padrão da política "profiles: self update" já existente.

create policy "participacoes: aluno atualiza a propria" on participacoes
  for update
  using (aluno_id = auth.uid())
  with check (aluno_id = auth.uid());
