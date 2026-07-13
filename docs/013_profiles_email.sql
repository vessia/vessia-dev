-- 013_profiles_email.sql
-- Vessia
-- Busca de aluno/professor por e-mail, não só nome (docs/DECISIONS.md).
-- profiles não guardava e-mail (só existia em auth.users, não consultável
-- pelo client normal sem service role) — replica aqui pra permitir busca.

alter table profiles
  add column email text;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id;

alter table profiles
  alter column email set not null;
