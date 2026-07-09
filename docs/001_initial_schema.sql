-- 001_initial_schema.sql
-- Vessia — Plataforma da Empresa Júnior
-- Derivado diretamente de 04 - Modelo Conceitual.md — nenhuma entidade nova foi
-- introduzida aqui que não estivesse já decidida em DECISIONS.md.

-- ============================================================
-- Extensões
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
create type papel_usuario as enum ('professor', 'aluno');
create type status_projeto as enum ('ativo', 'encerrado');
create type tipo_missao as enum ('estudar', 'entrevistar', 'escrever', 'desenvolver', 'testar', 'revisar', 'apresentar');
create type status_participacao as enum ('em_andamento', 'em_aprovacao', 'concluida');
create type resultado_avaliacao as enum ('aprovada', 'aprovada_com_ressalvas', 'rejeitada');
create type tipo_conteudo_entrega as enum ('texto', 'link', 'arquivo');
create type tipo_dono_arquivo as enum ('projeto', 'missao', 'entrega', 'avaliacao');
create type tipo_arquivo as enum ('arquivo', 'link');

-- ============================================================
-- Usuário (profiles — estende auth.users do Supabase)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel papel_usuario not null,
  criado_em timestamptz not null default now()
);

-- ============================================================
-- Projeto
-- ============================================================
create table projetos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  cliente text,
  status status_projeto not null default 'ativo',
  criado_por uuid not null references profiles(id),
  criado_em timestamptz not null default now(),
  encerrado_por uuid references profiles(id),
  encerrado_em timestamptz
);

-- ============================================================
-- Etapa
-- ============================================================
create table etapas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id) on delete cascade,
  nome text not null,
  ordem int not null,
  unique (projeto_id, ordem)
);

-- ============================================================
-- Missão
-- Status NÃO é armazenado (ver DECISIONS.md — "Status da Missão é sempre
-- calculado, nunca armazenado"). Apenas concluida_em / concluida_por.
-- ============================================================
create table missoes (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references etapas(id) on delete cascade,
  titulo text not null,
  descricao text,
  tipo tipo_missao not null,
  objetivo text not null,
  entrega_esperada text not null,
  criterio_avaliacao text not null,
  prazo timestamptz,
  vagas int not null default 1 check (vagas > 0),
  obrigatoria boolean not null default true,
  limite_reenvios int not null default 1 check (limite_reenvios >= 0),
  concluida_em timestamptz,
  concluida_por uuid references profiles(id)
);

-- Dependência entre missões (auto-relacionamento N:N)
create table missao_dependencias (
  missao_id uuid not null references missoes(id) on delete cascade,
  depende_de_id uuid not null references missoes(id) on delete cascade,
  primary key (missao_id, depende_de_id),
  check (missao_id <> depende_de_id)
);
-- Nota: bloqueio de dependência circular (A depende de B que depende de A)
-- não é garantido pelo banco em um check simples — deve ser validado na
-- aplicação antes do insert, conforme 05 - Fluxos.md.

-- ============================================================
-- Participação
-- ============================================================
create table participacoes (
  id uuid primary key default gen_random_uuid(),
  missao_id uuid not null references missoes(id) on delete cascade,
  aluno_id uuid not null references profiles(id),
  status status_participacao not null default 'em_andamento',
  criada_em timestamptz not null default now(),
  unique (missao_id, aluno_id) -- um aluno só participa de uma missão uma vez
);
create index idx_participacoes_missao on participacoes (missao_id);
create index idx_participacoes_aluno on participacoes (aluno_id);
create index idx_participacoes_missao_status on participacoes (missao_id, status);

-- ============================================================
-- Entrega
-- ============================================================
create table entregas (
  id uuid primary key default gen_random_uuid(),
  participacao_id uuid not null references participacoes(id) on delete cascade,
  conteudo text not null,
  tipo_conteudo tipo_conteudo_entrega not null,
  numero_tentativa int not null default 1 check (numero_tentativa > 0),
  enviada_em timestamptz not null default now(),
  unique (participacao_id, numero_tentativa)
);

-- ============================================================
-- Avaliação
-- ============================================================
create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null unique references entregas(id) on delete cascade,
  resultado resultado_avaliacao not null,
  feedback text,
  avaliador_id uuid not null references profiles(id),
  avaliada_em timestamptz not null default now(),
  check (resultado <> 'rejeitada' or feedback is not null) -- feedback obrigatório se rejeitada
);

-- ============================================================
-- Arquivo (Anexo — entidade polimórfica)
-- ============================================================
create table arquivos (
  id uuid primary key default gen_random_uuid(),
  dono_tipo tipo_dono_arquivo not null,
  dono_id uuid not null,
  nome text not null,
  url text not null,
  tipo tipo_arquivo not null,
  enviado_por uuid not null references profiles(id),
  enviado_em timestamptz not null default now()
);
create index idx_arquivos_dono on arquivos (dono_tipo, dono_id);

-- ============================================================
-- View: status calculado da Missão
-- Implementa a regra de 04 - Modelo Conceitual.md, seção 5:
--   1) concluida_em preenchido        -> 'concluida'
--   2) dependência não concluída      -> 'bloqueada'
--   3) existe participação            -> 'em_andamento'
--   4) caso contrário                 -> 'disponivel'
-- ============================================================
create view missoes_com_status as
select
  m.*,
  case
    when m.concluida_em is not null then 'concluida'
    when exists (
      select 1 from missao_dependencias md
      join missoes dep on dep.id = md.depende_de_id
      where md.missao_id = m.id
        and dep.concluida_em is null
    ) then 'bloqueada'
    when exists (
      select 1 from participacoes p where p.missao_id = m.id
    ) then 'em_andamento'
    else 'disponivel'
  end as status_calculado
from missoes m;

-- ============================================================
-- Row Level Security — esboço mínimo funcional
-- Professor: acesso total. Aluno: leitura geral + escrita restrita ao que é seu.
-- Refinar durante a implementação; não é um documento de produto, pode mudar
-- livremente sem passar por DECISIONS.md.
-- ============================================================
alter table profiles enable row level security;
alter table projetos enable row level security;
alter table etapas enable row level security;
alter table missoes enable row level security;
alter table missao_dependencias enable row level security;
alter table participacoes enable row level security;
alter table entregas enable row level security;
alter table avaliacoes enable row level security;
alter table arquivos enable row level security;

create policy "profiles: leitura geral" on profiles for select using (true);
create policy "profiles: self update" on profiles for update using (auth.uid() = id);

create policy "projetos: leitura geral" on projetos for select using (true);
create policy "projetos: escrita por professor" on projetos for all
  using (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'))
  with check (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'));

create policy "etapas: leitura geral" on etapas for select using (true);
create policy "etapas: escrita por professor" on etapas for all
  using (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'))
  with check (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'));

create policy "missoes: leitura geral" on missoes for select using (true);
create policy "missoes: escrita por professor" on missoes for all
  using (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'))
  with check (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'));

create policy "dependencias: leitura geral" on missao_dependencias for select using (true);
create policy "dependencias: escrita por professor" on missao_dependencias for all
  using (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'))
  with check (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'));

create policy "participacoes: leitura geral" on participacoes for select using (true);
create policy "participacoes: aluno cria a propria" on participacoes for insert
  with check (aluno_id = auth.uid());

create policy "entregas: leitura geral" on entregas for select using (true);
create policy "entregas: aluno cria a propria" on entregas for insert
  with check (
    exists (
      select 1 from participacoes p
      where p.id = participacao_id and p.aluno_id = auth.uid()
    )
  );

create policy "avaliacoes: leitura geral" on avaliacoes for select using (true);
create policy "avaliacoes: escrita por professor" on avaliacoes for insert
  with check (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'));

create policy "arquivos: leitura geral" on arquivos for select using (true);
create policy "arquivos: escrita por professor" on arquivos for insert
  with check (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'));
