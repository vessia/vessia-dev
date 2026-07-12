-- 010_termos_aceite.sql
-- Vessia
-- Registra o aceite explícito dos Termos de Uso e Política de Privacidade
-- no cadastro (docs/DECISIONS.md, "Termos de Uso e Política de Privacidade
-- publicados") — evidência de consentimento, não campo cosmético.
alter table profiles
  add column if not exists termos_aceitos_em timestamptz;
