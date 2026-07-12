-- 006_atribuicao_professores_alunos.sql
-- Vessia
-- Adiciona ProjetoProfessor e ProjetoAluno (04 - Modelo Conceitual.md, seções 3.1 e 3.2)
-- e reescreve a RLS de projetos/etapas/missoes/participacoes/avaliacoes/arquivos para
-- respeitar atribuição em vez de "qualquer professor" / "leitura geral".

-- ============================================================
-- Enums
-- ============================================================
create type papel_no_projeto as enum ('proprietario', 'colaborador');
create type status_atribuicao_aluno as enum ('convidado', 'aceito', 'recusado', 'saiu', 'removido');

-- ============================================================
-- ProjetoProfessor
-- ============================================================
create table projeto_professores (
  projeto_id uuid not null references projetos(id) on delete cascade,
  professor_id uuid not null references profiles(id),
  papel_no_projeto papel_no_projeto not null,
  adicionado_por uuid not null references profiles(id),
  adicionado_em timestamptz not null default now(),
  primary key (projeto_id, professor_id)
);
create index idx_projeto_professores_professor on projeto_professores (professor_id);

-- ============================================================
-- ProjetoAluno
-- ============================================================
create table projeto_alunos (
  projeto_id uuid not null references projetos(id) on delete cascade,
  aluno_id uuid not null references profiles(id),
  status status_atribuicao_aluno not null default 'convidado',
  atribuido_por uuid not null references profiles(id),
  atribuido_em timestamptz not null default now(),
  respondido_em timestamptz,
  primary key (projeto_id, aluno_id)
);
create index idx_projeto_alunos_aluno on projeto_alunos (aluno_id);
create index idx_projeto_alunos_projeto_status on projeto_alunos (projeto_id, status);

-- ============================================================
-- Funções auxiliares para RLS (evita repetir subqueries em toda policy)
-- ============================================================
create or replace function eh_professor_do_projeto(p_projeto_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from projeto_professores
    where projeto_id = p_projeto_id and professor_id = auth.uid()
  );
$$;

create or replace function eh_proprietario_do_projeto(p_projeto_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from projeto_professores
    where projeto_id = p_projeto_id and professor_id = auth.uid()
      and papel_no_projeto = 'proprietario'
  );
$$;

create or replace function eh_aluno_aceito_no_projeto(p_projeto_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from projeto_alunos
    where projeto_id = p_projeto_id and aluno_id = auth.uid()
      and status = 'aceito'
  );
$$;

-- ============================================================
-- RLS: projeto_professores
-- ============================================================
alter table projeto_professores enable row level security;

create policy "projeto_professores: leitura por quem está no projeto" on projeto_professores for select
  using (eh_professor_do_projeto(projeto_id) or eh_aluno_aceito_no_projeto(projeto_id));

create policy "projeto_professores: só proprietário adiciona" on projeto_professores for insert
  with check (eh_proprietario_do_projeto(projeto_id) or adicionado_por = auth.uid());
  -- adicionado_por = auth.uid() cobre o insert automático do proprietário original
  -- na criação do projeto (não existe ainda uma linha em projeto_professores nesse instante).

create policy "projeto_professores: só proprietário remove" on projeto_professores for delete
  using (eh_proprietario_do_projeto(projeto_id));

-- ============================================================
-- RLS: projeto_alunos
-- ============================================================
alter table projeto_alunos enable row level security;

create policy "projeto_alunos: professor do projeto vê tudo" on projeto_alunos for select
  using (eh_professor_do_projeto(projeto_id));

create policy "projeto_alunos: aluno vê a própria atribuição" on projeto_alunos for select
  using (aluno_id = auth.uid());

create policy "projeto_alunos: professor atribui" on projeto_alunos for insert
  with check (eh_professor_do_projeto(projeto_id));

create policy "projeto_alunos: professor remove, aluno responde ou sai" on projeto_alunos for update
  using (eh_professor_do_projeto(projeto_id) or aluno_id = auth.uid())
  with check (eh_professor_do_projeto(projeto_id) or aluno_id = auth.uid());
  -- Validação fina de qual transição de status é permitida para quem (ex: aluno não pode
  -- se auto-atribuir como 'aceito' sem nunca ter sido convidado) deve ser reforçada na
  -- aplicação, no Server Action — mesmo padrão já usado para ciclo de dependência e
  -- corrida de vaga (ver TECH-DEBT.md).

-- ============================================================
-- RLS: projetos (substitui a policy antiga de leitura geral / escrita por professor)
-- ============================================================
drop policy if exists "projetos: leitura geral" on projetos;
drop policy if exists "projetos: escrita por professor" on projetos;

create policy "projetos: leitura por quem está vinculado" on projetos for select
  using (eh_professor_do_projeto(id) or eh_aluno_aceito_no_projeto(id)
         or exists (select 1 from projeto_alunos where projeto_id = id and aluno_id = auth.uid()));
  -- inclui aluno com status 'convidado' (precisa ver o projeto pra decidir aceitar/recusar)

create policy "projetos: professor do projeto edita" on projetos for update
  using (eh_professor_do_projeto(id));

create policy "projetos: qualquer professor autenticado cria" on projetos for insert
  with check (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'));

-- ============================================================
-- RLS: etapas, missoes, missao_dependencias, avaliacoes, arquivos
-- (substituem "leitura geral" / "escrita por professor" por escopo de projeto)
-- ============================================================
drop policy if exists "etapas: leitura geral" on etapas;
drop policy if exists "etapas: escrita por professor" on etapas;
create policy "etapas: por quem está vinculado ao projeto" on etapas for select
  using (
    eh_professor_do_projeto((select projeto_id from etapas e where e.id = etapas.id))
    or eh_aluno_aceito_no_projeto((select projeto_id from etapas e where e.id = etapas.id))
  );
create policy "etapas: professor do projeto edita" on etapas for all
  using (eh_professor_do_projeto(projeto_id))
  with check (eh_professor_do_projeto(projeto_id));

drop policy if exists "missoes: leitura geral" on missoes;
drop policy if exists "missoes: escrita por professor" on missoes;
create policy "missoes: por quem está vinculado ao projeto" on missoes for select
  using (
    exists (
      select 1 from etapas e
      where e.id = missoes.etapa_id
        and (eh_professor_do_projeto(e.projeto_id) or eh_aluno_aceito_no_projeto(e.projeto_id))
    )
  );
create policy "missoes: professor do projeto edita" on missoes for all
  using (
    exists (select 1 from etapas e where e.id = missoes.etapa_id and eh_professor_do_projeto(e.projeto_id))
  )
  with check (
    exists (select 1 from etapas e where e.id = missoes.etapa_id and eh_professor_do_projeto(e.projeto_id))
  );

drop policy if exists "dependencias: leitura geral" on missao_dependencias;
drop policy if exists "dependencias: escrita por professor" on missao_dependencias;
create policy "dependencias: por quem está vinculado ao projeto" on missao_dependencias for select
  using (
    exists (
      select 1 from missoes m join etapas e on e.id = m.etapa_id
      where m.id = missao_dependencias.missao_id
        and (eh_professor_do_projeto(e.projeto_id) or eh_aluno_aceito_no_projeto(e.projeto_id))
    )
  );
create policy "dependencias: professor do projeto edita" on missao_dependencias for all
  using (
    exists (
      select 1 from missoes m join etapas e on e.id = m.etapa_id
      where m.id = missao_dependencias.missao_id and eh_professor_do_projeto(e.projeto_id)
    )
  )
  with check (
    exists (
      select 1 from missoes m join etapas e on e.id = m.etapa_id
      where m.id = missao_dependencias.missao_id and eh_professor_do_projeto(e.projeto_id)
    )
  );

drop policy if exists "avaliacoes: escrita por professor" on avaliacoes;
create policy "avaliacoes: professor do projeto avalia" on avaliacoes for insert
  with check (
    exists (
      select 1 from entregas en
      join participacoes p on p.id = en.participacao_id
      join missoes m on m.id = p.missao_id
      join etapas e on e.id = m.etapa_id
      where en.id = avaliacoes.entrega_id and eh_professor_do_projeto(e.projeto_id)
    )
  );

drop policy if exists "arquivos: escrita por professor" on arquivos;
-- Nota: arquivos é polimórfico (dono_tipo/dono_id) — restringir por projeto exigiria um
-- join condicional por tipo de dono. Mantido como "qualquer professor autenticado" por ora;
-- registrar em TECH-DEBT.md se isso for sensível o suficiente para refinar depois.
create policy "arquivos: professor autenticado escreve" on arquivos for insert
  with check (exists (select 1 from profiles where id = auth.uid() and papel = 'professor'));

-- ============================================================
-- RLS: participacoes (aluno só participa de projeto onde está 'aceito')
-- ============================================================
drop policy if exists "participacoes: aluno cria a propria" on participacoes;
create policy "participacoes: aluno aceito no projeto cria a propria" on participacoes for insert
  with check (
    aluno_id = auth.uid()
    and exists (
      select 1 from missoes m join etapas e on e.id = m.etapa_id
      where m.id = participacoes.missao_id and eh_aluno_aceito_no_projeto(e.projeto_id)
    )
  );
