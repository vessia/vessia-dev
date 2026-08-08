import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import { ITENS_ONBOARDING } from "../lib/onboarding/constantes";
import {
  criarClienteAutenticado,
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarParticipacaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

// docs/017_rls_entregas_participacoes_avaliacoes_escopo_projeto.sql: até essa
// migration, participacoes/entregas/avaliacoes tinham SELECT "leitura geral"
// (using true) — qualquer autenticado lia qualquer linha, de qualquer
// projeto. docs/018_rls_entregas_avaliacoes_apenas_dono_ou_professor.sql
// apertou mais: entregas/avaliacoes agora só o professor do projeto lê as
// de todo mundo — aluno só a própria (participacoes continua por vínculo de
// projeto, usada pra contar vagas/status, sem expor conteúdo).
// docs/019_missoes_entregas_visiveis_para_colegas.sql devolveu isso como
// opt-in por missão: `missoes.entregas_visiveis_para_colegas`, ligado pelo
// professor. Este arquivo cobre (1) que a RLS bloqueia quem não tem vínculo
// nenhum com o projeto, (2) que um aluno vinculado não lê a entrega de um
// colega por padrão, (3) que ligar o toggle da missão muda isso, e (4) a
// tela "Entregas desta missão"/"Sua entrega nesta missão" que resulta de
// tudo isso.

const SENHA = "senha-teste-vessia-123";

async function criarUsuarioAvulsoDeTeste(
  papel: "professor" | "aluno",
  nome: string,
) {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e.entregas-vis.${papel}.${sufixo}@vessia.test`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Falha ao criar ${papel} avulso de teste: ${error?.message}`);
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: data.user.id,
    nome,
    email,
    papel,
  });

  if (profileError) {
    throw new Error(
      `Falha ao criar profile avulso de teste (${papel}): ${profileError.message}`,
    );
  }

  // Sem isso, logar como este aluno pela UI cai no gate de onboarding em
  // vez da tela testada (mesmo motivo do global-setup.ts pré-completar o
  // aluno de teste compartilhado).
  if (papel === "aluno") {
    const { error: onboardingError } = await supabaseAdmin
      .from("onboarding_progresso")
      .insert(
        ITENS_ONBOARDING.map((item) => ({
          aluno_id: data.user.id,
          item: item.chave,
        })),
      );

    if (onboardingError) {
      throw new Error(
        `Falha ao pré-completar onboarding do aluno avulso de teste: ${onboardingError.message}`,
      );
    }
  }

  return { id: data.user.id, email, password: SENHA, nome, papel };
}

test("RLS bloqueia leitura de participacoes/entregas/avaliacoes por quem não está vinculado ao projeto", async () => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto RLS Escopo E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão RLS Escopo");
  const participacaoId = await criarParticipacaoDeTeste(
    missao.id,
    aluno.id,
    "em_aprovacao",
  );

  const { data: entrega, error: entregaError } = await supabaseAdmin
    .from("entregas")
    .insert({
      participacao_id: participacaoId,
      conteudo: "Conteúdo sigiloso do Projeto RLS Escopo",
      tipo_conteudo: "texto",
      numero_tentativa: 1,
    })
    .select("id")
    .single();
  if (entregaError || !entrega) {
    throw new Error(`Falha ao semear entrega: ${entregaError?.message}`);
  }
  const entregaId = entrega.id as string;

  const { data: avaliacao, error: avaliacaoError } = await supabaseAdmin
    .from("avaliacoes")
    .insert({
      entrega_id: entregaId,
      resultado: "aprovada",
      avaliador_id: professor.id,
    })
    .select("id")
    .single();
  if (avaliacaoError || !avaliacao) {
    throw new Error(`Falha ao semear avaliação: ${avaliacaoError?.message}`);
  }
  const avaliacaoId = avaliacao.id as string;

  // Aluno e professor de um projeto completamente alheio — nenhum vínculo
  // com o Projeto RLS Escopo.
  const outroProfessor = await criarUsuarioAvulsoDeTeste(
    "professor",
    `Professor Outro Projeto E2E ${Date.now()}`,
  );
  const outroAluno = await criarUsuarioAvulsoDeTeste(
    "aluno",
    `Aluno Outro Projeto E2E ${Date.now()}`,
  );

  try {
    const clienteProfessorAlheio = await criarClienteAutenticado(outroProfessor);
    const clienteAlunoAlheio = await criarClienteAutenticado(outroAluno);

    for (const cliente of [clienteProfessorAlheio, clienteAlunoAlheio]) {
      const { data: participacoesLidas } = await cliente
        .from("participacoes")
        .select("id")
        .eq("id", participacaoId);
      expect(participacoesLidas).toEqual([]);

      const { data: entregasLidas } = await cliente
        .from("entregas")
        .select("id")
        .eq("id", entregaId);
      expect(entregasLidas).toEqual([]);

      const { data: avaliacoesLidas } = await cliente
        .from("avaliacoes")
        .select("id")
        .eq("id", avaliacaoId);
      expect(avaliacoesLidas).toEqual([]);
    }

    // Controle positivo: quem TEM vínculo consegue ler normalmente — prova
    // que o bloqueio acima é a RLS escopando por projeto, não uma falha
    // genérica de leitura.
    const clienteProfessorVinculado = await criarClienteAutenticado(professor);
    const clienteAlunoVinculado = await criarClienteAutenticado(aluno);

    for (const cliente of [clienteProfessorVinculado, clienteAlunoVinculado]) {
      const { data: participacoesLidas } = await cliente
        .from("participacoes")
        .select("id")
        .eq("id", participacaoId);
      expect(participacoesLidas).toEqual([{ id: participacaoId }]);

      const { data: entregasLidas } = await cliente
        .from("entregas")
        .select("id")
        .eq("id", entregaId);
      expect(entregasLidas).toEqual([{ id: entregaId }]);

      const { data: avaliacoesLidas } = await cliente
        .from("avaliacoes")
        .select("id")
        .eq("id", avaliacaoId);
      expect(avaliacoesLidas).toEqual([{ id: avaliacaoId }]);
    }
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
    await supabaseAdmin.auth.admin.deleteUser(outroProfessor.id);
    await supabaseAdmin.auth.admin.deleteUser(outroAluno.id);
  }
});

test("tela da missão: professor vê a entrega de todo mundo, cada aluno só a própria", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Entregas Missao E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Entregas Visíveis", {
    vagas: null,
  });

  const colega = await criarUsuarioAvulsoDeTeste(
    "aluno",
    `Colega Entregas Missao E2E ${Date.now()}`,
  );

  try {
    const { error: colegaVinculoError } = await supabaseAdmin
      .from("projeto_alunos")
      .insert({
        projeto_id: projeto.id,
        aluno_id: colega.id,
        status: "aceito",
        atribuido_por: professor.id,
        respondido_em: new Date().toISOString(),
      });
    if (colegaVinculoError) {
      throw new Error(`Falha ao vincular colega: ${colegaVinculoError.message}`);
    }

    const participacaoAluno = await criarParticipacaoDeTeste(missao.id, aluno.id);
    const participacaoColega = await criarParticipacaoDeTeste(missao.id, colega.id);

    const { error: entregaAlunoError } = await supabaseAdmin
      .from("entregas")
      .insert({
        participacao_id: participacaoAluno,
        conteudo: "Pergunta enviada pelo Aluno E2E",
        tipo_conteudo: "texto",
        numero_tentativa: 1,
      });
    if (entregaAlunoError) {
      throw new Error(`Falha ao semear entrega do aluno: ${entregaAlunoError.message}`);
    }

    const { error: entregaColegaError } = await supabaseAdmin
      .from("entregas")
      .insert({
        participacao_id: participacaoColega,
        conteudo: "Pergunta enviada pelo Colega E2E",
        tipo_conteudo: "texto",
        numero_tentativa: 1,
      });
    if (entregaColegaError) {
      throw new Error(`Falha ao semear entrega do colega: ${entregaColegaError.message}`);
    }

    const urlMissao = `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`;

    // Professor vê as duas entregas.
    await loginViaUI(page, professor);
    await page.goto(urlMissao);
    await expect(page.getByText("Entregas desta missão")).toBeVisible();
    await expect(
      page.getByText("Pergunta enviada pelo Aluno E2E"),
    ).toBeVisible();
    await expect(
      page.getByText("Pergunta enviada pelo Colega E2E"),
    ).toBeVisible();

    // Aluno vê só a própria entrega — nem o texto nem o nome do colega
    // aparecem (docs/018_rls_entregas_avaliacoes_apenas_dono_ou_professor.sql).
    await loginViaUI(page, aluno);
    await page.goto(urlMissao);
    await expect(page.getByText("Sua entrega nesta missão")).toBeVisible();
    await expect(
      page.getByText("Pergunta enviada pelo Aluno E2E"),
    ).toBeVisible();
    await expect(
      page.getByText("Pergunta enviada pelo Colega E2E"),
    ).not.toBeVisible();
    await expect(page.getByText(colega.nome, { exact: true })).not.toBeVisible();

    // E vice-versa: colega vê só a própria, não a do aluno.
    await loginViaUI(page, colega);
    await page.goto(urlMissao);
    await expect(page.getByText("Sua entrega nesta missão")).toBeVisible();
    await expect(
      page.getByText("Pergunta enviada pelo Colega E2E"),
    ).toBeVisible();
    await expect(
      page.getByText("Pergunta enviada pelo Aluno E2E"),
    ).not.toBeVisible();
    await expect(page.getByText(aluno.nome, { exact: true })).not.toBeVisible();
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
    await supabaseAdmin.auth.admin.deleteUser(colega.id);
  }
});

test("professor liga 'colegas veem as entregas uns dos outros' na missão, e o aluno passa a ver a do colega", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Entregas Toggle E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(
    etapa.id,
    "Missão Entregas Colaborativas",
    { vagas: null, entregasVisiveisParaColegas: true },
  );

  const colega = await criarUsuarioAvulsoDeTeste(
    "aluno",
    `Colega Entregas Toggle E2E ${Date.now()}`,
  );

  try {
    const { error: colegaVinculoError } = await supabaseAdmin
      .from("projeto_alunos")
      .insert({
        projeto_id: projeto.id,
        aluno_id: colega.id,
        status: "aceito",
        atribuido_por: professor.id,
        respondido_em: new Date().toISOString(),
      });
    if (colegaVinculoError) {
      throw new Error(`Falha ao vincular colega: ${colegaVinculoError.message}`);
    }

    const participacaoAluno = await criarParticipacaoDeTeste(missao.id, aluno.id);
    const participacaoColega = await criarParticipacaoDeTeste(missao.id, colega.id);

    const { error: entregaAlunoError } = await supabaseAdmin
      .from("entregas")
      .insert({
        participacao_id: participacaoAluno,
        conteudo: "Pergunta colaborativa do Aluno E2E",
        tipo_conteudo: "texto",
        numero_tentativa: 1,
      });
    if (entregaAlunoError) {
      throw new Error(`Falha ao semear entrega do aluno: ${entregaAlunoError.message}`);
    }

    const { error: entregaColegaError } = await supabaseAdmin
      .from("entregas")
      .insert({
        participacao_id: participacaoColega,
        conteudo: "Pergunta colaborativa do Colega E2E",
        tipo_conteudo: "texto",
        numero_tentativa: 1,
      });
    if (entregaColegaError) {
      throw new Error(`Falha ao semear entrega do colega: ${entregaColegaError.message}`);
    }

    const urlMissao = `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`;

    // Com o toggle ligado, o aluno vê a entrega do colega — e a tela usa o
    // mesmo texto "Entregas desta missão" que o professor vê, não mais
    // "Sua entrega nesta missão".
    await loginViaUI(page, aluno);
    await page.goto(urlMissao);
    await expect(page.getByText("Entregas desta missão")).toBeVisible();
    await expect(
      page.getByText("Pergunta colaborativa do Aluno E2E"),
    ).toBeVisible();
    await expect(
      page.getByText("Pergunta colaborativa do Colega E2E"),
    ).toBeVisible();
    await expect(page.getByText(colega.nome, { exact: true })).toBeVisible();
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
    await supabaseAdmin.auth.admin.deleteUser(colega.id);
  }
});

test("professor ativa e desativa o toggle pela tela de editar missão, e isso muda o que o aluno vê", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Toggle UI E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Toggle UI", {
    vagas: null,
  });

  const colega = await criarUsuarioAvulsoDeTeste(
    "aluno",
    `Colega Toggle UI E2E ${Date.now()}`,
  );

  try {
    const { error: colegaVinculoError } = await supabaseAdmin
      .from("projeto_alunos")
      .insert({
        projeto_id: projeto.id,
        aluno_id: colega.id,
        status: "aceito",
        atribuido_por: professor.id,
        respondido_em: new Date().toISOString(),
      });
    if (colegaVinculoError) {
      throw new Error(`Falha ao vincular colega: ${colegaVinculoError.message}`);
    }

    const participacaoColega = await criarParticipacaoDeTeste(missao.id, colega.id);
    const { error: entregaColegaError } = await supabaseAdmin
      .from("entregas")
      .insert({
        participacao_id: participacaoColega,
        conteudo: "Entrega do Colega pro teste de toggle",
        tipo_conteudo: "texto",
        numero_tentativa: 1,
      });
    if (entregaColegaError) {
      throw new Error(`Falha ao semear entrega do colega: ${entregaColegaError.message}`);
    }

    const urlMissao = `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`;
    const urlEditar = `${urlMissao}/editar`;
    // atualizarMissao redireciona pra tela da etapa, não de volta pra missão.
    const urlEtapa = `/projetos/${projeto.slug}/etapas/${etapa.slug}`;
    const checkboxLabel = "Alunos veem as entregas uns dos outros nesta missão";

    // Estado inicial (toggle desligado, padrão da migration): aluno não vê
    // a entrega do colega.
    await loginViaUI(page, aluno);
    await page.goto(urlMissao);
    await expect(
      page.getByText("Entrega do Colega pro teste de toggle"),
    ).not.toBeVisible();

    // Professor liga o toggle pela tela de editar.
    await loginViaUI(page, professor);
    await page.goto(urlEditar);
    await expect(page.getByLabel(checkboxLabel)).not.toBeChecked();
    await page.getByLabel(checkboxLabel).check();
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(urlEtapa);

    // Aluno agora vê a entrega do colega.
    await loginViaUI(page, aluno);
    await page.goto(urlMissao);
    await expect(
      page.getByText("Entrega do Colega pro teste de toggle"),
    ).toBeVisible();

    // Professor desliga de novo.
    await loginViaUI(page, professor);
    await page.goto(urlEditar);
    await expect(page.getByLabel(checkboxLabel)).toBeChecked();
    await page.getByLabel(checkboxLabel).uncheck();
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(urlEtapa);

    // E some de novo pro aluno.
    await loginViaUI(page, aluno);
    await page.goto(urlMissao);
    await expect(
      page.getByText("Entrega do Colega pro teste de toggle"),
    ).not.toBeVisible();
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
    await supabaseAdmin.auth.admin.deleteUser(colega.id);
  }
});
