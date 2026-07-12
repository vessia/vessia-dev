-- 009_storage_entregas_imagens.sql
-- Vessia
-- Bucket privado para upload de imagem em Entregas (docs/DECISIONS.md,
-- "Entregas passam a suportar upload de imagem de verdade").
-- Renumerar se já existir 009 no repositório (Claude Code criou 007 e 008
-- corrigindo bugs de RLS depois do Bloco 12 — confira antes de aplicar).

-- ============================================================
-- Bucket
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entregas-arquivos',
  'entregas-arquivos',
  false, -- privado: leitura só via URL assinada gerada no servidor
  10485760, -- 10MB (cobre o maior caso, PDF; validar limite específico por tipo na aplicação)
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

-- ============================================================
-- Políticas de Storage
-- Convenção de path: {aluno_id}/{participacao_id}/{numero_tentativa}/{nome_arquivo}
-- Upload: só o próprio aluno, e só dentro de uma Participação que é dele
--   (checagem de dono via o primeiro segmento do path == auth.uid();
--   a validação de que a Participação/Missão/Projeto realmente permite o envio
--   já acontece na aplicação antes de gerar a URL de upload, mesmo padrão de
--   limite de reenvios e vaga já usado no resto do sistema).
-- Leitura: NINGUÉM lê diretamente do bucket (sem policy de select para usuários
--   comuns) — a aplicação gera URLs assinadas de curta duração no servidor,
--   depois de confirmar acesso via as mesmas funções de RLS já existentes
--   (eh_professor_do_projeto / eh_aluno_aceito_no_projeto), evitando duplicar
--   essa lógica de novo dentro das policies do Storage.
-- ============================================================

create policy "entregas-arquivos: aluno faz upload na própria pasta"
on storage.objects for insert
with check (
  bucket_id = 'entregas-arquivos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "entregas-arquivos: aluno pode substituir/apagar a própria pasta"
on storage.objects for update
using (
  bucket_id = 'entregas-arquivos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'entregas-arquivos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "entregas-arquivos: aluno pode apagar a própria pasta"
on storage.objects for delete
using (
  bucket_id = 'entregas-arquivos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Sem policy de SELECT para usuários comuns — leitura é feita exclusivamente
-- pelo servidor, usando o client de service role (lib/supabase/admin.ts, já
-- existente desde o Bloco 2), depois de validar acesso pela aplicação.