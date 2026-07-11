-- 004_participacoes_professor_update_policy.sql
-- Vessia — Bloco 9 (Avaliação): ao aprovar/reprovar uma Entrega, o professor
-- precisa mudar o status da Participação do ALUNO (concluida ou de volta
-- para em_andamento). A policy de update criada em 003 só cobre
-- `aluno_id = auth.uid()` — o professor avaliando a participação de outra
-- pessoa cai fora dela e seria bloqueado por RLS. Mesmo padrão de
-- "escrita por professor" já usado em projetos/etapas/missoes.

create policy "participacoes: professor atualiza" on participacoes
  for update
  using (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'))
  with check (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'));
