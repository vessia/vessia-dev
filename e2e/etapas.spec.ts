import { expect, test } from "@playwright/test";
import { criarProjetoDeTeste, lerUsuariosDeTeste, loginViaUI } from "./helpers";

test("professor não consegue criar duas etapas com a mesma ordem no mesmo projeto", async ({
  page,
}) => {
  const { professor } = lerUsuariosDeTeste();
  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Etapas E2E ${Date.now()}`,
  );

  await loginViaUI(page, professor);

  await page.goto(`/projetos/${projetoId}/etapas/nova`);
  await page.getByLabel("Nome").fill("Descoberta");
  await page.getByLabel("Ordem").fill("1");
  await page.getByRole("button", { name: "Salvar" }).click();
  await page.waitForURL(`**/projetos/${projetoId}`);
  await expect(page.getByText("Descoberta")).toBeVisible();

  await page.goto(`/projetos/${projetoId}/etapas/nova`);
  await page.getByLabel("Nome").fill("PRD");
  await page.getByLabel("Ordem").fill("1");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page).toHaveURL(/\/etapas\/nova\?error=/);
  await expect(page.getByTestId("banner-error")).toContainText(
    "Já existe uma etapa com essa ordem",
  );

  // A segunda etapa não deve ter sido criada.
  await page.goto(`/projetos/${projetoId}`);
  await expect(page.getByText("PRD")).toHaveCount(0);
});
