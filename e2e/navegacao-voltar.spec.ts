import { expect, test } from "@playwright/test";
import {
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

// Investigação do relato original: aluno na tela da missão, aperta voltar
// do navegador, e a missão que era clicável no mapa do projeto para de
// responder a clique. O repro original usava um projeto com termo
// específico pendente (só porque foi o cenário em que apareceu), mas o
// bug em si é sobre cache de navegação "voltar", sem relação com termo —
// desde que o aceite do termo virou gate de projeto (DECISIONS.md), não dá
// mais pra chegar no mapa com termo pendente, então o teste não usa mais.
test("missão continua clicável no mapa do projeto depois do botão voltar do navegador", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();

  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Voltar E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Voltar E2E");

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projeto.slug}`);

  const linkMissao = page.getByRole("link", { name: /Missão Voltar E2E/ });
  await expect(linkMissao).toBeVisible();
  await linkMissao.click();

  await expect(page).toHaveURL(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`,
  );
  await expect(page.getByRole("button", { name: "Participar" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(`/projetos/${projeto.slug}`);

  // O ponto central do relato: o link precisa continuar navegável, não só
  // visível. Um clique real precisa mudar a URL.
  const linkMissaoDepoisDeVoltar = page.getByRole("link", {
    name: /Missão Voltar E2E/,
  });
  await expect(linkMissaoDepoisDeVoltar).toBeVisible();
  await linkMissaoDepoisDeVoltar.click({ timeout: 5000 });

  await expect(page).toHaveURL(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`,
    { timeout: 5000 },
  );
});
