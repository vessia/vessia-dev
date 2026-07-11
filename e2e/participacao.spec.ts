import { expect, test } from "@playwright/test";
import {
  buscarStatusParticipacao,
  contarEntregas,
  criarEntregaDeTeste,
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarParticipacaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

test("aluno participa de uma missão e envia uma entrega", async ({ page }) => {
  const { professor, aluno } = lerUsuariosDeTeste();

  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Participacao E2E ${Date.now()}`,
  );
  const etapaId = await criarEtapaDeTeste(projetoId, "Descoberta", 1);
  const missaoId = await criarMissaoDeTeste(etapaId, "Missão Participável");

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoId}`);

  await expect(page.getByText("0 de 1 preenchidas")).toBeVisible();
  await page.getByRole("button", { name: "Participar" }).click();

  // Após participar: some o botão, aparece o form de entrega, vaga contada.
  await expect(page.getByText("1 de 1 preenchidas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Participar" })).toHaveCount(
    0,
  );
  await expect(page.getByText("Enviar entrega")).toBeVisible();

  await page.getByPlaceholder("Descreva o que você produziu, ou cole o link aqui...").fill(
    "Minha entrega de teste.",
  );
  await page.getByRole("button", { name: "Enviar" }).click();

  await expect(
    page.getByText("Entrega enviada — aguardando avaliação do professor."),
  ).toBeVisible();
  await expect(page.getByText("Enviar entrega")).toHaveCount(0);
});

test("mostra 'vagas esgotadas' quando a única vaga já está ocupada", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();

  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Vagas E2E ${Date.now()}`,
  );
  const etapaId = await criarEtapaDeTeste(projetoId, "Descoberta", 1);
  // vagas = 1 (default do schema).
  const missaoId = await criarMissaoDeTeste(etapaId, "Missão Com 1 Vaga");
  // Ocupa a única vaga com outro "aluno" (usa o id do professor de teste só
  // como um segundo profile qualquer, pra não depender de uma terceira conta).
  await criarParticipacaoDeTeste(missaoId, professor.id);

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoId}`);

  await expect(page.getByText("1 de 1 preenchidas")).toBeVisible();
  await expect(page.getByText("Vagas esgotadas.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Participar" })).toHaveCount(
    0,
  );
});

test("bloqueia envio de entrega quando o limite de reenvios já foi atingido", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();

  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Reenvio E2E ${Date.now()}`,
  );
  const etapaId = await criarEtapaDeTeste(projetoId, "Descoberta", 1);
  // limite_reenvios = 1 (default do schema).
  const missaoId = await criarMissaoDeTeste(etapaId, "Missão Limite Reenvio");
  const participacaoId = await criarParticipacaoDeTeste(missaoId, aluno.id);
  // Já usou a única tentativa permitida.
  await criarEntregaDeTeste(participacaoId, 1);

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoId}`);
  await page.getByPlaceholder("Descreva o que você produziu, ou cole o link aqui...").fill(
    "Tentativa além do limite.",
  );
  await page.getByRole("button", { name: "Enviar" }).click();

  await expect(page.getByTestId("banner-error")).toContainText(
    "Limite de reenvios atingido",
  );

  // Nem a entrega extra foi criada, nem o status da participação mudou.
  expect(await contarEntregas(participacaoId)).toBe(1);
  expect(await buscarStatusParticipacao(participacaoId)).toBe("em_andamento");
});
