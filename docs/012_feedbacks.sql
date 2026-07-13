-- 012_feedbacks.sql
-- Vessia
-- Widget de feedback guiado (docs/DECISIONS.md, "Widget de feedback guiado,
-- dentro do app"). Sem tela de administração ainda — leitura só via
-- Supabase Table Editor (service role), por isso não existe policy de
-- select pra usuário comum.

create type categoria_feedback as enum (
  'nao_sei_o_que_fazer',
  'muito_clique',
  'tela_confusa',
  'esta_bom',
  'outro'
);

create table feedbacks (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references profiles(id),
  papel_no_momento papel_usuario not null,
  avaliacao integer not null check (avaliacao between 1 and 5),
  categoria categoria_feedback not null,
  comentario text,
  pagina_origem text not null,
  criado_em timestamptz not null default now()
);

alter table feedbacks enable row level security;

create policy "feedbacks: usuario insere o proprio" on feedbacks for insert
  with check (usuario_id = auth.uid());

-- Sem policy de select para authenticated/anon de propósito — só o service
-- role (Table Editor) lê. Construir uma tela de visualização só se o
-- volume justificar (ver DECISIONS.md).
