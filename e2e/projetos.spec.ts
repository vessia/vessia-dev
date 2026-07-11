import { expect, test } from "@playwright/test";
import { lerUsuariosDeTeste, loginViaUI } from "./helpers";

test.describe("CRUD de projeto", () => {
  test("professor cria projeto e ele aparece na lista", async ({ page }) => {
    const { professor } = lerUsuariosDeTeste();
    await loginViaUI(page, professor);

    const nomeProjeto = `Projeto E2E ${Date.now()}`;

    await page.goto("/projetos/novo");
    await page.getByLabel("Nome").fill(nomeProjeto);
    await page.getByLabel("Cliente").fill("Cliente E2E");
    await page.getByRole("button", { name: "Salvar" }).click();

    await page.waitForURL("**/projetos");
    await expect(page.getByRole("link", { name: nomeProjeto })).toBeVisible();
  });

  test("aluno não vê botão de criar projeto e acesso direto é bloqueado", async ({
    page,
  }) => {
    const { aluno } = lerUsuariosDeTeste();
    await loginViaUI(page, aluno);

    await page.goto("/projetos");
    await expect(
      page.getByRole("link", { name: "Novo projeto" }),
    ).not.toBeVisible();

    await page.goto("/projetos/novo");
    await expect(page).toHaveURL(/\/projetos\?error=/);
    await expect(page.getByTestId("banner-error")).toContainText(
      "Apenas professores podem fazer isso.",
    );
  });
});
