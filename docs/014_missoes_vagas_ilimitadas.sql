-- 014_missoes_vagas_ilimitadas.sql
-- Vessia
-- Missão pode ter vagas ilimitadas (docs/DECISIONS.md).
-- `vagas` passa a aceitar null, com o significado explícito de "sem
-- limite". O check constraint `vagas > 0` já existente não precisa mudar:
-- em Postgres um CHECK só rejeita quando avalia para false — com vagas
-- null a expressão avalia para null, o que não viola a constraint.

alter table missoes alter column vagas drop not null;
