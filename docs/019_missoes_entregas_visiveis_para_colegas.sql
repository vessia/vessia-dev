-- 019_missoes_entregas_visiveis_para_colegas.sql
-- Vessia
-- docs/018_rls_entregas_avaliacoes_apenas_dono_ou_professor.sql tornou a
-- leitura de entregas padrão "só o dono e o professor". Pedido do Gestor
-- (2026-08-07): o professor precisa poder escolher, por missão, se os
-- colegas voltam a ver as entregas uns dos outros — útil pra missões de
-- contribuição coletiva (ex.: "Propor perguntas para a entrevista",
-- DECISIONS.md), onde ver o que os colegas já mandaram é o ponto. Padrão
-- fica desligado (privado), como em 018 — o professor liga por missão.

alter table missoes
  add column entregas_visiveis_para_colegas boolean not null default false;

drop policy if exists "entregas: professor do projeto ou dono da participação" on entregas;
create policy "entregas: professor, dono, ou colega se a missão permitir" on entregas for select
  using (
    exists (
      select 1 from participacoes p
      join missoes m on m.id = p.missao_id
      join etapas e on e.id = m.etapa_id
      where p.id = entregas.participacao_id
        and (
          eh_professor_do_projeto(e.projeto_id)
          or p.aluno_id = auth.uid()
          or (m.entregas_visiveis_para_colegas and eh_aluno_aceito_no_projeto(e.projeto_id))
        )
    )
  );
