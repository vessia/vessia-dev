import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import {
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

// Investigação: na tela da Etapa, o título/linha da missão não era
// clicável pra visão de professor (só o link "Editar", que abre outro
// formulário) — professor não tinha como chegar na página de detalhe da
// missão (Bloco 9: participações + "Marcar missão como concluída") a
// partir dali.

test("professor clica no título da missão na etapa e chega na página de detalhe com a visão de professor (Bloco 9)", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor } = lerUsuariosDeTeste();
  const nomeProjeto = `Projeto Nav Professor E2E ${Date.now()}`;
  const projeto = await criarProjetoDeTeste(professor.id, nomeProjeto);
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Nav Professor E2E");

  try {
    await loginViaUI(page, professor);
    await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);

    // O ponto central: clicar no TÍTULO da missão (não no "Editar").
    await page.getByRole("link", { name: /Missão Nav Professor E2E/ }).click();
    await expect(page).toHaveURL(
      `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`,
    );

    // Visão de professor (Bloco 9): resumo de participações + botão de
    // concluir manualmente — não a visão de aluno (botão "Participar").
    await expect(page.getByText(/Participações:/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Marcar missão como concluída" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Participar" })).toHaveCount(
      0,
    );
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});

test("outros links da tela de etapa (Editar etapa, Nova missão, Voltar) continuam funcionando", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor } = lerUsuariosDeTeste();
  const nomeProjeto = `Projeto Nav Links Etapa E2E ${Date.now()}`;
  const projeto = await criarProjetoDeTeste(professor.id, nomeProjeto);
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  await criarMissaoDeTeste(etapa.id, "Missão Qualquer E2E");

  try {
    await loginViaUI(page, professor);
    await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);

    await page.getByRole("link", { name: "Editar etapa" }).click();
    await expect(page).toHaveURL(
      `/projetos/${projeto.slug}/etapas/${etapa.slug}/editar`,
    );

    await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);
    await page.getByRole("link", { name: "Nova missão" }).click();
    await expect(page).toHaveURL(
      `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/nova`,
    );

    await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(`/projetos/${projeto.slug}`);
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});

test("links da tela do projeto (Editar projeto, Alunos, Professores, Voltar) continuam funcionando", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor } = lerUsuariosDeTeste();
  const nomeProjeto = `Projeto Nav Links Projeto E2E ${Date.now()}`;
  const projeto = await criarProjetoDeTeste(professor.id, nomeProjeto);

  try {
    await loginViaUI(page, professor);
    await page.goto(`/projetos/${projeto.slug}`);

    await page.getByRole("link", { name: "Editar projeto" }).click();
    await expect(page).toHaveURL(`/projetos/${projeto.slug}/editar`);

    await page.goto(`/projetos/${projeto.slug}`);
    await page.getByRole("link", { name: "Alunos" }).click();
    await expect(page).toHaveURL(`/projetos/${projeto.slug}/alunos`);

    await page.goto(`/projetos/${projeto.slug}`);
    // Só o proprietário vê "Professores" — criarProjetoDeTeste já deixa o
    // professor de teste como proprietário.
    await page.getByRole("link", { name: "Professores" }).click();
    await expect(page).toHaveURL(`/projetos/${projeto.slug}/professores`);

    await page.goto(`/projetos/${projeto.slug}`);
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL("/projetos");
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});
