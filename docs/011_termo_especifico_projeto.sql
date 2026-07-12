-- 011_termo_especifico_projeto.sql
-- Vessia
-- Termo opcional por Projeto (docs/DECISIONS.md, "Termo específico por Projeto").
-- Renumerar conforme a sequência real do repositório (Claude Code já criou 007, 008 e
-- um 010_termos_aceite.sql para os Termos globais — confira antes de aplicar).

alter table projetos
  add column termo_especifico text;

alter table projeto_alunos
  add column termo_aceito_em timestamptz;

-- Nenhuma policy nova necessária: leitura/escrita de projetos e projeto_alunos já são
-- cobertas pelas policies existentes de 006_atribuicao_professores_alunos.sql. A
-- validação de "não pode participar sem aceitar o termo" é regra de aplicação (mesmo
-- padrão já usado para ciclo de dependência e corrida de vaga — ver TECH-DEBT.md),
-- reforçada no Server Action de criar Participação.