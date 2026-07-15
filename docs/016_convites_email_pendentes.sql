-- 016_convites_email_pendentes.sql
-- Vessia
-- Convite por e-mail (docs/DECISIONS.md: "Link de convite por Projeto — adiado" em favor
-- deste fluxo). Professor convida um e-mail que ainda não tem conta; quando essa pessoa
-- se cadastra como aluno, o convite é resolvido automaticamente (app/cadastro/actions.ts).

create table convites_email_pendentes (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id) on delete cascade,
  email text not null,
  convidado_por uuid not null references profiles(id),
  criado_em timestamptz not null default now(),
  resolvido_em timestamptz
);

-- Lookup do cadastro é só por e-mail (resolve pendências em qualquer projeto de uma vez).
create index idx_convites_email_pendentes_email_pendente
  on convites_email_pendentes (email)
  where resolvido_em is null;

-- Lookup da tela de alunos: já existe pendência não resolvida pra esse projeto+email?
create index idx_convites_email_pendentes_projeto_email_pendente
  on convites_email_pendentes (projeto_id, email)
  where resolvido_em is null;

alter table convites_email_pendentes enable row level security;

-- Resolução (update de resolvido_em + insert em projeto_alunos) acontece no cadastro
-- público via client admin (service role, sem RLS) — quem está se cadastrando não é
-- professor de projeto nenhum, mesmo padrão já usado pra criar o profile no cadastro.
create policy "convites_email_pendentes: professor do projeto lê" on convites_email_pendentes for select
  using (eh_professor_do_projeto(projeto_id));

create policy "convites_email_pendentes: professor do projeto insere" on convites_email_pendentes for insert
  with check (eh_professor_do_projeto(projeto_id));
