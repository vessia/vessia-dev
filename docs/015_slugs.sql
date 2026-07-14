-- 015_slugs.sql
-- Vessia
-- Adiciona slug a projetos, etapas e missoes para URLs amigáveis.
-- A chave primária (id, uuid) não muda em lugar nenhum — slug é só uma
-- chave de busca alternativa para resolver rotas. Renumerar se necessário.

create extension if not exists unaccent;

alter table projetos add column slug text;
alter table etapas add column slug text;
alter table missoes add column slug text;

-- Únicos: projeto globalmente, etapa por projeto, missão por etapa.
create unique index idx_projetos_slug on projetos (slug);
create unique index idx_etapas_projeto_slug on etapas (projeto_id, slug);
create unique index idx_missoes_etapa_slug on missoes (etapa_id, slug);

-- Backfill para os dados já existentes (o projeto Bíblia 3D real).
-- Gera um slug simples a partir do nome: minúsculas, sem acento, espaços
-- viram hífen. Ajustar manualmente se algum nome gerar colisão.
update projetos set slug = lower(regexp_replace(unaccent(nome), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

update etapas set slug = lower(regexp_replace(unaccent(nome), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

update missoes set slug = lower(regexp_replace(unaccent(titulo), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

alter table projetos alter column slug set not null;
alter table etapas alter column slug set not null;
alter table missoes alter column slug set not null;