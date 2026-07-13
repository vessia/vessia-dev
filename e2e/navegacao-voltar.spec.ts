import { expect, test } from "@playwright/test";
import {
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

// Investigação do relato: aluno na tela da missão (antes de aceitar o termo
// específico), aperta voltar do navegador, e a missão que era clicável no
// mapa do projeto para de responder a clique.
test("missão continua clicável no mapa do projeto depois do botão voltar do navegador", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();

  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Voltar E2E ${Date.now()}`,
    {
      alunoAceitoId: aluno.id,
      termoEspecifico: "Termo específico de teste — aceite obrigatório antes de participar.",
    },
  );
  const etapaId = await criarEtapaDeTeste(projetoId, "Descoberta", 1);
  const missaoId = await criarMissaoDeTeste(etapaId, "Missão Voltar E2E");

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projetoId}`);

  const linkMissao = page.getByRole("link", { name: /Missão Voltar E2E/ });
  await expect(linkMissao).toBeVisible();
  await linkMissao.click();

  await expect(page).toHaveURL(
    `/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoId}`,
  );
  await expect(page.getByText("Termo específico deste projeto")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(`/projetos/${projetoId}`);

  // O ponto central do relato: o link precisa continuar navegável, não só
  // visível. Um clique real precisa mudar a URL.
  const linkMissaoDepoisDeVoltar = page.getByRole("link", {
    name: /Missão Voltar E2E/,
  });
  await expect(linkMissaoDepoisDeVoltar).toBeVisible();
  await linkMissaoDepoisDeVoltar.click({ timeout: 5000 });

  await expect(page).toHaveURL(
    `/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoId}`,
    { timeout: 5000 },
  );
});
