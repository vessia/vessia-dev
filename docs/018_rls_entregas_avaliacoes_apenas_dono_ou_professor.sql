-- 018_rls_entregas_avaliacoes_apenas_dono_ou_professor.sql
-- Vessia
-- A migration 017 fechou a "leitura geral" de participacoes/entregas/
-- avaliacoes, mas escopou as três por vínculo de PROJETO (professor OU
-- qualquer aluno aceito nele) — na prática, qualquer aluno vinculado ainda
-- lia a entrega e a avaliação de qualquer colega no mesmo projeto. Decisão
-- do Gestor (2026-08-07): o conteúdo da entrega/avaliação é do aluno que a
-- fez, não do projeto — cada aluno só pode ler a própria. Professor
-- continua vendo tudo (é quem avalia).
--
-- participacoes NÃO muda aqui: continua "professor OU aluno aceito no
-- projeto" de propósito — é usada pra contar vagas preenchidas e calcular o
-- status (🟢/🟡) de missões de colegas nas telas de etapa/mapa, e só expõe
-- aluno_id/status, não o conteúdo enviado.

drop policy if exists "entregas: por quem está vinculado ao projeto" on entregas;
create policy "entregas: professor do projeto ou dono da participação" on entregas for select
  using (
    exists (
      select 1 from participacoes p
      join missoes m on m.id = p.missao_id
      join etapas e on e.id = m.etapa_id
      where p.id = entregas.participacao_id
        and (eh_professor_do_projeto(e.projeto_id) or p.aluno_id = auth.uid())
    )
  );

drop policy if exists "avaliacoes: por quem está vinculado ao projeto" on avaliacoes;
create policy "avaliacoes: professor do projeto ou dono da participação" on avaliacoes for select
  using (
    exists (
      select 1 from entregas en
      join participacoes p on p.id = en.participacao_id
      join missoes m on m.id = p.missao_id
      join etapas e on e.id = m.etapa_id
      where en.id = avaliacoes.entrega_id
        and (eh_professor_do_projeto(e.projeto_id) or p.aluno_id = auth.uid())
    )
  );
