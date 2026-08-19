import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import {
  criarClienteAutenticado,
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarParticipacaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

// DECISIONS.md, "Conclusão manual de Etapa, com resumo + anexos/links" e
// "RLS de Arquivo passa a ser escopada por projeto" (docs/
// 020_conclusao_etapa_e_rls_arquivos.sql): a Etapa ganha concluida_em/
// concluida_por/resumo_encerramento, e o anexo/link da conclusão é salvo
// como Arquivo (dono_tipo = 'etapa'). Essa correção de RLS fechou uma dívida
// técnica antiga — arquivos.select era "leitura geral" (using true) desde o
// Bloco 6 — então este arquivo cobre tanto o fluxo novo (upload de docx,
// visibilidade da conclusão pra aluno vinculado) quanto o escopo por projeto
// da RLS corrigida (anexo de missão, conteúdo de entrega e anexo de etapa).

const SENHA = "senha-teste-vessia-123";

async function criarUsuarioAvulsoDeTeste(
  papel: "professor" | "aluno",
  nome: string,
) {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e.etapa-conclusao.${papel}.${sufixo}@vessia.test`;

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

  return { id: data.user.id, email, password: SENHA, nome, papel };
}

test("RLS: aluno de outro projeto não vê anexos deste projeto (missão, entrega, etapa)", async () => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto RLS Arquivos E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão RLS Arquivos");
  const participacaoId = await criarParticipacaoDeTeste(
    missao.id,
    aluno.id,
    "em_aprovacao",
  );

  const { data: entrega, error: entregaError } = await supabaseAdmin
    .from("entregas")
    .insert({
      participacao_id: participacaoId,
      conteudo: "Conteúdo sigiloso de entrega — RLS de arquivos",
      tipo_conteudo: "texto",
      numero_tentativa: 1,
    })
    .select("id")
    .single();
  if (entregaError || !entrega) {
    throw new Error(`Falha ao semear entrega: ${entregaError?.message}`);
  }
  const entregaId = entrega.id as string;

  const { data: anexoMissao, error: anexoMissaoError } = await supabaseAdmin
    .from("arquivos")
    .insert({
      dono_tipo: "missao",
      dono_id: missao.id,
      nome: "Roteiro sigiloso da missão",
      url: "https://exemplo.com/roteiro-sigiloso.pdf",
      tipo: "link",
      enviado_por: professor.id,
    })
    .select("id")
    .single();
  if (anexoMissaoError || !anexoMissao) {
    throw new Error(`Falha ao semear anexo de missão: ${anexoMissaoError?.message}`);
  }

  const { data: anexoEtapa, error: anexoEtapaError } = await supabaseAdmin
    .from("arquivos")
    .insert({
      dono_tipo: "etapa",
      dono_id: etapa.id,
      nome: "Resumo sigiloso da etapa",
      url: "https://exemplo.com/resumo-sigiloso.pdf",
      tipo: "link",
      enviado_por: professor.id,
    })
    .select("id")
    .single();
  if (anexoEtapaError || !anexoEtapa) {
    throw new Error(`Falha ao semear anexo de etapa: ${anexoEtapaError?.message}`);
  }

  // Aluno e professor de um projeto completamente alheio — nenhum vínculo
  // com o Projeto RLS Arquivos.
  const outroProfessor = await criarUsuarioAvulsoDeTeste(
    "professor",
    `Professor Outro Projeto Arquivos E2E ${Date.now()}`,
  );
  const outroAluno = await criarUsuarioAvulsoDeTeste(
    "aluno",
    `Aluno Outro Projeto Arquivos E2E ${Date.now()}`,
  );

  try {
    const clienteProfessorAlheio = await criarClienteAutenticado(outroProfessor);
    const clienteAlunoAlheio = await criarClienteAutenticado(outroAluno);

    for (const cliente of [clienteProfessorAlheio, clienteAlunoAlheio]) {
      const { data: anexoMissaoLido } = await cliente
        .from("arquivos")
        .select("id")
        .eq("id", anexoMissao.id);
      expect(anexoMissaoLido).toEqual([]);

      const { data: anexoEtapaLido } = await cliente
        .from("arquivos")
        .select("id")
        .eq("id", anexoEtapa.id);
      expect(anexoEtapaLido).toEqual([]);

      const { data: entregaLida } = await cliente
        .from("entregas")
        .select("id")
        .eq("id", entregaId);
      expect(entregaLida).toEqual([]);
    }

    // Controle positivo: quem TEM vínculo consegue ler normalmente — prova
    // que o bloqueio acima é a RLS escopando por projeto, não uma falha
    // genérica de leitura.
    const clienteProfessorVinculado = await criarClienteAutenticado(professor);
    const clienteAlunoVinculado = await criarClienteAutenticado(aluno);

    for (const cliente of [clienteProfessorVinculado, clienteAlunoVinculado]) {
      const { data: anexoMissaoLido } = await cliente
        .from("arquivos")
        .select("id")
        .eq("id", anexoMissao.id);
      expect(anexoMissaoLido).toEqual([{ id: anexoMissao.id }]);

      const { data: anexoEtapaLido } = await cliente
        .from("arquivos")
        .select("id")
        .eq("id", anexoEtapa.id);
      expect(anexoEtapaLido).toEqual([{ id: anexoEtapa.id }]);
    }

    // entregas continua "professor OU dono da participação" — o professor
    // vinculado lê, o aluno vinculado só leria se fosse o dono (é, aqui).
    const { data: entregaLidaProfessor } = await clienteProfessorVinculado
      .from("entregas")
      .select("id")
      .eq("id", entregaId);
    expect(entregaLidaProfessor).toEqual([{ id: entregaId }]);

    const { data: entregaLidaAluno } = await clienteAlunoVinculado
      .from("entregas")
      .select("id")
      .eq("id", entregaId);
    expect(entregaLidaAluno).toEqual([{ id: entregaId }]);
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
    await supabaseAdmin.auth.admin.deleteUser(outroProfessor.id);
    await supabaseAdmin.auth.admin.deleteUser(outroAluno.id);
  }
});

test("professor conclui a etapa com resumo, upload de docx e link — aluno vinculado vê tudo", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Conclusao Etapa E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);

  const urlEtapa = `/projetos/${projeto.slug}/etapas/${etapa.slug}`;

  try {
    await loginViaUI(page, professor);
    await page.goto(urlEtapa);

    await page
      .getByPlaceholder("O que foi feito nesta etapa...")
      .fill("Entrevistamos o responsável e mapeamos os requisitos.");
    await page.locator('input[type="file"]').setInputFiles({
      name: "resumo-descoberta.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from("conteúdo docx de teste"),
    });
    await page.getByLabel("Nome do link (opcional)").fill("PRD");
    await page
      .getByLabel("URL do link (opcional)")
      .fill("https://exemplo.com/prd");
    await page.getByRole("button", { name: "Concluir etapa" }).click();

    await expect(page.getByText(/Etapa concluída em/)).toBeVisible();
    await expect(
      page.getByText(
        "Entrevistamos o responsável e mapeamos os requisitos.",
      ),
    ).toBeVisible();

    const linkArquivo = page.getByRole("link", {
      name: "resumo-descoberta.docx",
    });
    await expect(linkArquivo).toBeVisible();
    const hrefArquivo = await linkArquivo.getAttribute("href");
    expect(hrefArquivo).toBeTruthy();
    expect(hrefArquivo).toContain("entregas-arquivos");

    const linkExterno = page.getByRole("link", { name: "PRD" });
    await expect(linkExterno).toBeVisible();
    await expect(linkExterno).toHaveAttribute(
      "href",
      "https://exemplo.com/prd",
    );

    // Confirma no banco: etapa marcada concluída e o docx salvo como Arquivo
    // de verdade (dono_tipo='etapa'), não só a tela mostrando algo.
    const { data: etapaAtualizada } = await supabaseAdmin
      .from("etapas")
      .select("concluida_em, concluida_por, resumo_encerramento")
      .eq("id", etapa.id)
      .single();
    expect(etapaAtualizada?.concluida_em).toBeTruthy();
    expect(etapaAtualizada?.concluida_por).toBe(professor.id);
    expect(etapaAtualizada?.resumo_encerramento).toContain(
      "Entrevistamos o responsável",
    );

    const { data: arquivoDocx } = await supabaseAdmin
      .from("arquivos")
      .select("nome, url, tipo")
      .eq("dono_tipo", "etapa")
      .eq("dono_id", etapa.id)
      .eq("tipo", "arquivo")
      .single();
    expect(arquivoDocx?.nome).toBe("resumo-descoberta.docx");
    expect(arquivoDocx?.url).toContain(`${professor.id}/etapas/${etapa.id}/`);
    expect(arquivoDocx?.url).toContain("resumo-descoberta.docx");

    // Aluno vinculado ao projeto vê a mesma conclusão — não só o professor.
    await loginViaUI(page, aluno);
    await page.goto(urlEtapa);
    await expect(page.getByText(/Etapa concluída em/)).toBeVisible();
    await expect(
      page.getByText(
        "Entrevistamos o responsável e mapeamos os requisitos.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "resumo-descoberta.docx" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "PRD" })).toBeVisible();
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});

test("professor edita o resumo de encerramento depois da etapa já concluída", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Editar Resumo Etapa E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);

  const { error: concluirError } = await supabaseAdmin
    .from("etapas")
    .update({
      concluida_em: new Date().toISOString(),
      concluida_por: professor.id,
      resumo_encerramento: "Resumo original da conclusão.",
    })
    .eq("id", etapa.id);
  if (concluirError) {
    throw new Error(`Falha ao semear etapa concluída: ${concluirError.message}`);
  }

  const urlEtapa = `/projetos/${projeto.slug}/etapas/${etapa.slug}`;

  try {
    await loginViaUI(page, professor);
    await page.goto(urlEtapa);

    await expect(page.getByLabel("Resumo de encerramento")).toHaveValue(
      "Resumo original da conclusão.",
    );

    await page
      .getByLabel("Resumo de encerramento")
      .fill("Resumo revisado depois da conclusão.");
    await page.getByRole("button", { name: "Salvar resumo" }).click();

    await expect(
      page.getByText("Resumo revisado depois da conclusão."),
    ).toBeVisible();

    const { data: etapaAtualizada } = await supabaseAdmin
      .from("etapas")
      .select("concluida_em, concluida_por, resumo_encerramento")
      .eq("id", etapa.id)
      .single();
    expect(etapaAtualizada?.resumo_encerramento).toBe(
      "Resumo revisado depois da conclusão.",
    );
    // Editar o resumo não deve mexer em quem/quando concluiu.
    expect(etapaAtualizada?.concluida_por).toBe(professor.id);
    expect(etapaAtualizada?.concluida_em).toBeTruthy();

    // Aluno vinculado vê o texto atualizado, mas não tem como editá-lo.
    await loginViaUI(page, aluno);
    await page.goto(urlEtapa);
    await expect(
      page.getByText("Resumo revisado depois da conclusão."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Salvar resumo" }),
    ).not.toBeVisible();
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});
