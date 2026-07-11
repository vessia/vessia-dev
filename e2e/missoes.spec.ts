import { expect, test } from "@playwright/test";
import {
  contarDependencias,
  criarDependenciaDeTeste,
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

test("professor não consegue salvar missão sem objetivo/entrega/critério", async ({
  page,
}) => {
  const { professor } = lerUsuariosDeTeste();
  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Missoes E2E ${Date.now()}`,
  );
  const etapaId = await criarEtapaDeTeste(projetoId, "Descoberta", 1);

  await loginViaUI(page, professor);

  await page.goto(`/projetos/${projetoId}/etapas/${etapaId}/missoes/nova`);
  await page.getByLabel("Título").fill("Missão incompleta");
  await page.getByLabel("Tipo").selectOption("estudar");
  // Espaço em branco: passa pela validação HTML5 "required" do navegador,
  // mas deve ser rejeitado pelo trim() da Server Action.
  await page.getByLabel("Objetivo").fill(" ");
  await page.getByLabel("Entrega esperada").fill(" ");
  await page.getByLabel("Critério de avaliação").fill(" ");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page).toHaveURL(/\/missoes\/nova\?error=/);
  await expect(page.getByTestId("banner-error")).toBeVisible();

  await page.goto(`/projetos/${projetoId}/etapas/${etapaId}`);
  await expect(page.getByText("Missão incompleta")).toHaveCount(0);
});

test("professor não consegue criar dependência que fecha ciclo", async ({
  page,
}) => {
  const { professor } = lerUsuariosDeTeste();
  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Ciclo E2E ${Date.now()}`,
  );
  const etapaId = await criarEtapaDeTeste(projetoId, "Descoberta", 1);

  const missaoAId = await criarMissaoDeTeste(etapaId, "Missão A");
  const missaoBId = await criarMissaoDeTeste(etapaId, "Missão B");
  // B já depende de A.
  await criarDependenciaDeTeste(missaoBId, missaoAId);

  await loginViaUI(page, professor);

  // Tentar fazer A depender de B fecharia o ciclo A -> B -> A.
  await page.goto(
    `/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoAId}/editar`,
  );
  await page.getByTestId(`dependencia-${missaoBId}`).check();
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page).toHaveURL(/\/editar\?error=/);
  await expect(page.getByTestId("banner-error")).toContainText("ciclo");

  const dependenciaCriada = await contarDependencias(missaoAId, missaoBId);
  expect(dependenciaCriada).toBe(0);
});
