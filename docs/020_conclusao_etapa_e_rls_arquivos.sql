-- 020_conclusao_etapa_e_rls_arquivos.sql
-- Vessia
-- Conclusão manual de Etapa (resumo + anexos via Arquivo) e correção da RLS de
-- arquivos para ser escopada por projeto.
--
-- IMPORTANTE (rodar em duas etapas): o ALTER TYPE ... ADD VALUE abaixo não
-- pode rodar na mesma transação que já usa o valor novo em seguida (limitação
-- do Postgres). Rode a seção "Arquivo passa a aceitar 'etapa' como dono"
-- sozinha primeiro, com commit, e só depois o restante deste arquivo.

-- ============================================================
-- PARTE 1 — rodar sozinha, com commit antes do resto
-- Arquivo passa a aceitar 'etapa' como dono
-- ============================================================
alter type tipo_dono_arquivo add value if not exists 'etapa';

-- ============================================================
-- PARTE 2 — rodar depois que a PARTE 1 já tiver sido commitada
-- ============================================================

-- Conclusão de Etapa
alter table etapas add column concluida_em timestamptz;
alter table etapas add column concluida_por uuid references profiles(id);
alter table etapas add column resumo_encerramento text;

-- Bucket de entregas: ampliar whitelist para incluir docx
-- (reaproveita o bucket 'entregas-arquivos' já usado por entregas/anexos de
-- missão — mesmo padrão de reuso já estabelecido)
update storage.buckets
set allowed_mime_types = array[
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
],
file_size_limit = 10485760 -- 10MB, cobre o maior caso (docx/pdf)
where id = 'entregas-arquivos';

-- Função auxiliar: resolve o projeto de um Arquivo a partir do dono_tipo/dono_id
create or replace function projeto_id_do_arquivo(p_dono_tipo tipo_dono_arquivo, p_dono_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select case p_dono_tipo
    when 'projeto' then p_dono_id
    when 'etapa' then (select projeto_id from etapas where id = p_dono_id)
    when 'missao' then (
      select e.projeto_id from missoes m join etapas e on e.id = m.etapa_id
      where m.id = p_dono_id
    )
    when 'entrega' then (
      select e.projeto_id from entregas en
      join participacoes p on p.id = en.participacao_id
      join missoes m on m.id = p.missao_id
      join etapas e on e.id = m.etapa_id
      where en.id = p_dono_id
    )
    when 'avaliacao' then (
      select e.projeto_id from avaliacoes av
      join entregas en on en.id = av.entrega_id
      join participacoes p on p.id = en.participacao_id
      join missoes m on m.id = p.missao_id
      join etapas e on e.id = m.etapa_id
      where av.id = p_dono_id
    )
  end;
$$;

-- RLS de arquivos: escopar por projeto, mesmo padrão do Bloco 12
drop policy if exists "arquivos: leitura geral" on arquivos;
drop policy if exists "arquivos: professor autenticado escreve" on arquivos;
drop policy if exists "arquivos: professor autenticado insere" on arquivos;

create policy "arquivos: por quem está vinculado ao projeto" on arquivos for select
  using (
    eh_professor_do_projeto(projeto_id_do_arquivo(dono_tipo, dono_id))
    or eh_aluno_aceito_no_projeto(projeto_id_do_arquivo(dono_tipo, dono_id))
  );

create policy "arquivos: professor do projeto escreve" on arquivos for insert
  with check (eh_professor_do_projeto(projeto_id_do_arquivo(dono_tipo, dono_id)));
