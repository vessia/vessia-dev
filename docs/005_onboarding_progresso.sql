-- 005_onboarding_progresso.sql
-- Vessia — Bloco 10 (Onboarding). Ver DECISIONS.md: tabela dedicada, não
-- reaproveita Missão/Participação/Entrega/Avaliação — a Etapa 0 de
-- 03 - Projeto Bíblia 3D.md é autoavaliada pelo aluno (sem entrega, sem
-- aprovação do professor) e não pertence a nenhum Projeto/professor
-- específico.

create table onboarding_progresso (
  aluno_id uuid not null references profiles(id) on delete cascade,
  item text not null check (
    item in ('conheca_empresa', 'como_funcionam_missoes', 'como_entregar_aprovacao')
  ),
  concluido_em timestamptz not null default now(),
  primary key (aluno_id, item)
);

alter table onboarding_progresso enable row level security;

-- Progresso de onboarding é pessoal — ninguém além do próprio aluno
-- precisa ler isso (diferente do padrão "leitura geral" do resto do
-- schema, que existe pra professor acompanhar o trabalho da turma).
create policy "onboarding: leitura da propria" on onboarding_progresso
  for select using (aluno_id = auth.uid());

create policy "onboarding: aluno marca a propria" on onboarding_progresso
  for insert with check (aluno_id = auth.uid());
