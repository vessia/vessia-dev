-- 008_fix_projetos_insert_returning_rls.sql
-- Bug real (não só de teste): criarProjeto faz INSERT ... RETURNING id em
-- "projetos" e SÓ DEPOIS insere a linha de proprietario em
-- projeto_professores (não dá pra fazer os dois num insert só). Mas o
-- Postgres RLS exige que a linha recém-criada seja visível pela policy de
-- SELECT quando há RETURNING — e no momento do insert em "projetos" ainda
-- não existe vínculo em projeto_professores, então a policy de leitura
-- ("por quem está vinculado") reprova a própria linha que acabou de criar,
-- e o insert falha com "new row violates row-level security policy for
-- table projetos" antes mesmo de chegar no segundo insert.
-- Fix: quem criou o projeto sempre pode vê-lo, independente de vínculo —
-- seguro porque a aplicação nunca permite remover o proprietário original
-- (ver "Não é possível remover o proprietário do projeto" em
-- app/projetos/[id]/professores/actions.ts), então isso nunca amplia
-- acesso além do que o vínculo já garantiria de qualquer forma.
drop policy if exists "projetos: leitura por quem está vinculado" on projetos;
create policy "projetos: leitura por quem está vinculado" on projetos for select
  using (
    criado_por = auth.uid()
    or eh_professor_do_projeto(id)
    or eh_aluno_aceito_no_projeto(id)
    or exists (select 1 from projeto_alunos where projeto_id = id and aluno_id = auth.uid())
  );
