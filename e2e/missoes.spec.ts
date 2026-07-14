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
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Missoes E2E ${Date.now()}`,
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);

  await loginViaUI(page, professor);

  await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/nova`);
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

  await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);
  await expect(page.getByText("Missão incompleta")).toHaveCount(0);
});

test("professor não consegue criar dependência que fecha ciclo", async ({
  page,
}) => {
  const { professor } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Ciclo E2E ${Date.now()}`,
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);

  const missaoA = await criarMissaoDeTeste(etapa.id, "Missão A");
  const missaoB = await criarMissaoDeTeste(etapa.id, "Missão B");
  // B já depende de A.
  await criarDependenciaDeTeste(missaoB.id, missaoA.id);

  await loginViaUI(page, professor);

  // Tentar fazer A depender de B fecharia o ciclo A -> B -> A.
  await page.goto(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missaoA.slug}/editar`,
  );
  await page.getByTestId(`dependencia-${missaoB.id}`).check();
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page).toHaveURL(/\/editar\?error=/);
  await expect(page.getByTestId("banner-error")).toContainText("ciclo");

  const dependenciaCriada = await contarDependencias(missaoA.id, missaoB.id);
  expect(dependenciaCriada).toBe(0);
});
