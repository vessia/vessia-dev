import { expect, test } from "@playwright/test";
import {
  criarDependenciaDeTeste,
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
  marcarMissaoConcluidaDeTeste,
} from "./helpers";

test("aluno navega pelo mapa do projeto: progresso, status e detalhe da missão", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();

  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Mapa Aluno E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapaId = await criarEtapaDeTeste(projetoId, "Descoberta", 1);

  // C: sem dependências, não concluída -> disponível.
  const missaoCId = await criarMissaoDeTeste(etapaId, "Missão C - Base");
  // B: depende de C (que não está concluída) -> bloqueada.
  const missaoBId = await criarMissaoDeTeste(etapaId, "Missão B - Depende de C");
  await criarDependenciaDeTeste(missaoBId, missaoCId);
  // A: sem dependências, marcada como concluída -> concluída.
  const missaoAId = await criarMissaoDeTeste(etapaId, "Missão A - Primeira");
  await marcarMissaoConcluidaDeTeste(missaoAId, professor.id);

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projetoId}`);

  // 3 missões obrigatórias, 1 concluída -> 33%.
  await expect(page.getByText("Progresso: 33%")).toBeVisible();

  // Disponível e concluída são clicáveis (viram link); bloqueada não.
  await expect(
    page.getByRole("link", { name: /Missão C - Base/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Missão A - Primeira/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Missão B - Depende de C/ }),
  ).toHaveCount(0);
  // O título da bloqueada ainda aparece na tela, só não como link.
  await expect(page.getByText("Missão B - Depende de C")).toBeVisible();

  // Abre o detalhe da missão disponível pelo mapa.
  await page.getByRole("link", { name: /Missão C - Base/ }).click();
  await page.waitForURL(`**/missoes/${missaoCId}`);
  await expect(page.getByTestId("missao-status-badge")).toContainText(
    "Disponível",
  );
  await expect(page.getByText("Objetivo de teste")).toBeVisible();
  await expect(page.getByText("Entrega de teste")).toBeVisible();
  await expect(page.getByText("Critério de teste")).toBeVisible();
  await expect(page.getByText("0 de 1 preenchidas")).toBeVisible();
  // Disponível: botão de participar real (Bloco 8), não mais o placeholder
  // desabilitado do Bloco 7.
  await expect(page.getByRole("button", { name: "Participar" })).toBeEnabled();

  // Missão bloqueada: acessível direto pela URL (leitura geral), mostra a
  // dependência pendente e não mostra nenhum botão de participar.
  await page.goto(`/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoBId}`);
  await expect(page.getByTestId("missao-status-badge")).toContainText(
    "Bloqueada",
  );
  await expect(page.getByText("Missão C - Base")).toBeVisible();
  await expect(page.getByRole("button", { name: "Participar" })).toHaveCount(
    0,
  );

  // Missão concluída: badge correto, sem botão de participar.
  await page.goto(`/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoAId}`);
  await expect(page.getByTestId("missao-status-badge")).toContainText(
    "Concluída",
  );
  await expect(page.getByRole("button", { name: "Participar" })).toHaveCount(
    0,
  );
});
