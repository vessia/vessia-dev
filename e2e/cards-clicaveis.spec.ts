import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import {
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

// DECISIONS.md, "Cards inteiros clicáveis (Projeto, Etapa, Missão)": achado
// real de uso — só o título dentro do card era um link, o resto não
// reagia a clique. Padrão "stretched link" (after:inset-0) faz o card
// inteiro navegar, mantendo as ações internas (Editar, Encerrar) clicáveis
// de forma independente, sem disparar a navegação do card.

test("card de projeto: clicar em área sem link navega, e Editar/Encerrar continuam independentes", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor } = lerUsuariosDeTeste();
  const nomeProjeto = `Projeto Card Clicavel E2E ${Date.now()}`;
  const projeto = await criarProjetoDeTeste(professor.id, nomeProjeto);

  try {
    await loginViaUI(page, professor);
    await page.goto("/projetos");

    // Clica no canto do card (padding, antes de qualquer conteúdo) — só o
    // stretched link cobre essa área. Precisa ser um clique posicionado no
    // próprio <li> (não num texto irmão do link): o Playwright recusa
    // ".click()" num elemento cujo ponto é interceptado por um elemento que
    // não é seu descendente — o <a> com o overlay é irmão do texto do
    // cliente, não ancestral dele, então clicar direto no texto trava
    // esperando uma "actionability" que nunca vem (o intercept É o
    // comportamento certo, só não bate com a checagem do Playwright).
    await page
      .locator("li", { hasText: nomeProjeto })
      .click({ position: { x: 4, y: 4 } });
    await expect(page).toHaveURL(`/projetos/${projeto.slug}`);

    await page.goto("/projetos");
    await page
      .locator("li", { hasText: nomeProjeto })
      .getByRole("link", { name: "Editar" })
      .click();
    await expect(page).toHaveURL(`/projetos/${projeto.slug}/editar`);

    await page.goto("/projetos");
    await page
      .locator("li", { hasText: nomeProjeto })
      .getByRole("button", { name: "Encerrar" })
      .click();
    // Encerrar redireciona pra /projetos (não pro card do projeto) — se o
    // clique tivesse sido engolido pelo stretched link, teria ido parar em
    // /projetos/{slug} em vez de ficar em /projetos.
    await expect(page).toHaveURL("/projetos");
    await expect(
      page.locator("li", { hasText: nomeProjeto }),
    ).toContainText("Encerrado");
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});

test("card de etapa: clicar em área sem link navega pra etapa, e Editar continua independente", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Card Etapa E2E ${Date.now()}`,
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);

  try {
    await loginViaUI(page, professor);
    await page.goto(`/projetos/${projeto.slug}`);

    // Clica no canto do card (padding) — mesmo motivo do teste de projeto
    // acima: precisa ser um clique posicionado no <li>, não num texto irmão.
    await page
      .locator("li", { hasText: "Descoberta" })
      .click({ position: { x: 4, y: 4 } });
    await expect(page).toHaveURL(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);

    await page.goto(`/projetos/${projeto.slug}`);
    await page
      .locator("li", { hasText: "Descoberta" })
      .getByRole("link", { name: "Editar" })
      .click();
    await expect(page).toHaveURL(
      `/projetos/${projeto.slug}/etapas/${etapa.slug}/editar`,
    );
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});

test("card de etapa (mapa do aluno): clicar na área do card navega pra etapa, mas clicar numa missão específica navega pra ela, não pra etapa", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Card Etapa Aluno E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Card Aluno E2E");

  try {
    await loginViaUI(page, aluno);
    await page.goto(`/projetos/${projeto.slug}`);

    // A missão está DENTRO do card da etapa — precisa continuar navegando
    // pra ela mesma (não pra etapa), mesmo com o stretched link da etapa
    // cobrindo o card inteiro por baixo.
    await page.getByRole("link", { name: /Missão Card Aluno E2E/ }).click();
    await expect(page).toHaveURL(
      `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`,
    );

    // Já num canto do card da etapa que não é a missão nem qualquer link
    // (padding, antes do círculo de ordem) — aí sim navega pra etapa.
    await page.goto(`/projetos/${projeto.slug}`);
    await page
      .locator("li", { hasText: "Descoberta" })
      .click({ position: { x: 4, y: 4 } });
    await expect(page).toHaveURL(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});

test("card de missão (tela da etapa): clicar em área sem link navega pra missão, e Editar continua independente", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Card Missao E2E ${Date.now()}`,
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Card E2E");

  try {
    await loginViaUI(page, professor);
    await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);

    // Clica bem no canto do card (padding, fora do link do título e fora
    // do bloco de badge/Editar) — só o stretched link cobre essa área.
    await page
      .locator("li", { hasText: "Missão Card E2E" })
      .click({ position: { x: 4, y: 4 } });
    await expect(page).toHaveURL(
      `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`,
    );

    await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);
    await page
      .locator("li", { hasText: "Missão Card E2E" })
      .getByRole("link", { name: "Editar" })
      .click();
    await expect(page).toHaveURL(
      `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}/editar`,
    );
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});
