import { expect, test } from "@playwright/test";
import {
  criarDependenciaDeTeste,
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

test("professor marca missão base como concluída via UI e a missão dependente vira disponível para o aluno", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();

  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Desbloqueio E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missaoBase = await criarMissaoDeTeste(
    etapa.id,
    "Missão Base Desbloqueio",
  );
  const missaoDependente = await criarMissaoDeTeste(
    etapa.id,
    "Missão Dependente Desbloqueio",
  );
  await criarDependenciaDeTeste(missaoDependente.id, missaoBase.id);

  // 1. Antes: aluno vê a dependente como bloqueada, tanto no mapa quanto no
  // detalhe direto.
  await loginViaUI(page, aluno);

  await page.goto(`/projetos/${projeto.slug}`);
  await expect(
    page.getByRole("link", { name: /Missão Dependente Desbloqueio/ }),
  ).toHaveCount(0);
  await expect(page.getByText("Missão Dependente Desbloqueio")).toBeVisible();

  await page.goto(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missaoDependente.slug}`,
  );
  await expect(page.getByTestId("missao-status-badge")).toContainText(
    "Bloqueada",
  );
  // "Missão Base Desbloqueio" aparece na lista de dependências com o ícone
  // 🔒 — como o próprio badge de status acima também usa 🔒, checar só o
  // emoji seria ambíguo (mesmo erro do Bloco 7); o texto do título já
  // confirma que a dependência pendente está listada.
  await expect(page.getByText("Missão Base Desbloqueio")).toBeVisible();

  // 2. Professor marca a missão base como concluída — clique real na UI,
  // não seed direto no banco.
  await loginViaUI(page, professor);
  await page.goto(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missaoBase.slug}`,
  );
  await page
    .getByRole("button", { name: "Marcar missão como concluída" })
    .click();
  await expect(page.getByText(/Concluída em/)).toBeVisible();

  // 3. Depois: sem nenhuma ação manual sobre a dependente, ela aparece
  // disponível para o aluno — status é sempre calculado, nunca armazenado.
  await loginViaUI(page, aluno);

  await page.goto(`/projetos/${projeto.slug}`);
  await expect(
    page.getByRole("link", { name: /Missão Dependente Desbloqueio/ }),
  ).toBeVisible();

  await page.goto(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missaoDependente.slug}`,
  );
  await expect(page.getByTestId("missao-status-badge")).toContainText(
    "Disponível",
  );
  // A dependência (agora concluída) aparece marcada com ✅ na lista —
  // escopado ao item da lista pra não colidir com outros ✅ na página.
  await expect(
    page.locator("li", { hasText: "Missão Base Desbloqueio" }),
  ).toContainText("✅");
});
