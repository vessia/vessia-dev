-- 007_fix_etapas_rls_recursion.sql
-- A policy de select em "etapas" criada na migration 006 usava uma
-- subquery auto-referenciada (select ... from etapas e where e.id =
-- etapas.id) para pegar o projeto_id da própria linha, em vez de usar
-- etapas.projeto_id diretamente. Isso reavalia a RLS de etapas dentro da
-- própria RLS de etapas -> "infinite recursion detected in policy for
-- relation etapas" (42P17), quebrando toda leitura de etapas (e,
-- transitivamente, de missoes/dependencias, que fazem join com etapas).
drop policy if exists "etapas: por quem está vinculado ao projeto" on etapas;
create policy "etapas: por quem está vinculado ao projeto" on etapas for select
  using (
    eh_professor_do_projeto(etapas.projeto_id)
    or eh_aluno_aceito_no_projeto(etapas.projeto_id)
  );
