-- 017_rls_entregas_participacoes_avaliacoes_escopo_projeto.sql
-- Vessia
-- A migration 006 (Bloco 12) escopou a leitura de projetos/etapas/missoes por
-- vínculo (eh_professor_do_projeto / eh_aluno_aceito_no_projeto), mas deixou
-- passar as policies de SELECT "leitura geral" (using (true)) de
-- participacoes, entregas e avaliacoes, criadas em 001_initial_schema.sql —
-- qualquer usuário autenticado, mesmo sem nenhum vínculo com o projeto,
-- conseguia ler a participação/entrega/avaliação de qualquer aluno em
-- qualquer projeto. Fecha essa lacuna com o mesmo padrão de escopo já usado
-- no resto do sistema desde o Bloco 12.
--
-- Também é o que viabiliza a tela "Entregas desta missão" (DECISIONS.md,
-- "Missão 1 do Bíblia 3D redesenhada"): professor do projeto e qualquer
-- aluno aceito nele (não só o autor) passam a poder ler todas as
-- participações/entregas/avaliações daquele projeto — antes disso dependia
-- da RLS aberta demais, o que não dava pra manter.

drop policy if exists "participacoes: leitura geral" on participacoes;
create policy "participacoes: por quem está vinculado ao projeto" on participacoes for select
  using (
    exists (
      select 1 from missoes m
      join etapas e on e.id = m.etapa_id
      where m.id = participacoes.missao_id
        and (eh_professor_do_projeto(e.projeto_id) or eh_aluno_aceito_no_projeto(e.projeto_id))
    )
  );

drop policy if exists "entregas: leitura geral" on entregas;
create policy "entregas: por quem está vinculado ao projeto" on entregas for select
  using (
    exists (
      select 1 from participacoes p
      join missoes m on m.id = p.missao_id
      join etapas e on e.id = m.etapa_id
      where p.id = entregas.participacao_id
        and (eh_professor_do_projeto(e.projeto_id) or eh_aluno_aceito_no_projeto(e.projeto_id))
    )
  );

drop policy if exists "avaliacoes: leitura geral" on avaliacoes;
create policy "avaliacoes: por quem está vinculado ao projeto" on avaliacoes for select
  using (
    exists (
      select 1 from entregas en
      join participacoes p on p.id = en.participacao_id
      join missoes m on m.id = p.missao_id
      join etapas e on e.id = m.etapa_id
      where en.id = avaliacoes.entrega_id
        and (eh_professor_do_projeto(e.projeto_id) or eh_aluno_aceito_no_projeto(e.projeto_id))
    )
  );
