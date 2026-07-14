import { expect, test } from "@playwright/test";
import {
  buscarAvaliacao,
  buscarStatusParticipacao,
  criarEntregaDeTeste,
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarParticipacaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";
import { supabaseAdmin } from "./supabase-admin";

test("professor vê a pendência no dashboard e aprova a entrega", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();

  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Avaliacao E2E ${Date.now()}`,
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Para Avaliar");
  const participacaoId = await criarParticipacaoDeTeste(
    missao.id,
    aluno.id,
    "em_aprovacao",
  );
  const entregaId = await criarEntregaDeTeste(participacaoId, 1);

  await loginViaUI(page, professor);
  await page.goto("/dashboard");

  await expect(page.getByText("Missão Para Avaliar")).toBeVisible();
  await page.getByRole("link", { name: /Missão Para Avaliar/ }).click();
  await page.waitForURL(`**/avaliacoes/${entregaId}`);

  await expect(page.getByText("Critério de teste")).toBeVisible();
  await expect(page.getByText("Conteúdo de teste")).toBeVisible();

  await page.getByRole("button", { name: "Aprovar", exact: true }).click();
  await page.waitForURL("**/dashboard");

  expect(await buscarStatusParticipacao(participacaoId)).toBe("concluida");
  const avaliacao = await buscarAvaliacao(entregaId);
  expect(avaliacao?.resultado).toBe("aprovada");
});

test("rejeitar sem feedback é bloqueado com mensagem amigável", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();

  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Rejeicao E2E ${Date.now()}`,
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Rejeicao");
  const participacaoId = await criarParticipacaoDeTeste(
    missao.id,
    aluno.id,
    "em_aprovacao",
  );
  const entregaId = await criarEntregaDeTeste(participacaoId, 1);

  await loginViaUI(page, professor);
  await page.goto(`/avaliacoes/${entregaId}`);
  await page.getByRole("button", { name: "Rejeitar" }).click();

  await expect(page.getByTestId("banner-error")).toContainText(
    "Feedback é obrigatório ao rejeitar",
  );
  expect(await buscarAvaliacao(entregaId)).toBeNull();
  expect(await buscarStatusParticipacao(participacaoId)).toBe("em_aprovacao");
});

test("rejeitar com feedback volta a participação para em_andamento", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();

  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Rejeicao2 E2E ${Date.now()}`,
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(
    etapa.id,
    "Missão Rejeicao Com Feedback",
  );
  const participacaoId = await criarParticipacaoDeTeste(
    missao.id,
    aluno.id,
    "em_aprovacao",
  );
  const entregaId = await criarEntregaDeTeste(participacaoId, 1);

  await loginViaUI(page, professor);
  await page.goto(`/avaliacoes/${entregaId}`);
  await page
    .getByLabel("Feedback (obrigatório se rejeitar)")
    .fill("Faltou detalhar o processo.");
  await page.getByRole("button", { name: "Rejeitar" }).click();
  await page.waitForURL("**/dashboard");

  expect(await buscarStatusParticipacao(participacaoId)).toBe("em_andamento");
  const avaliacao = await buscarAvaliacao(entregaId);
  expect(avaliacao?.resultado).toBe("rejeitada");
  expect(avaliacao?.feedback).toBe("Faltou detalhar o processo.");
});

test("professor marca missão como concluída com o resumo de participações visível", async ({
  page,
}) => {
  const { professor } = lerUsuariosDeTeste();

  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Conclusao E2E ${Date.now()}`,
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão A Concluir");

  await loginViaUI(page, professor);
  await page.goto(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`,
  );

  await expect(page.getByText(/Participações: 0 aprovada/)).toBeVisible();
  await page
    .getByRole("button", { name: "Marcar missão como concluída" })
    .click();

  await expect(page.getByText(/Concluída em/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Marcar missão como concluída" }),
  ).toHaveCount(0);

  const { data: missaoAtualizada } = await supabaseAdmin
    .from("missoes")
    .select("concluida_em, concluida_por")
    .eq("id", missao.id)
    .single();
  expect(missaoAtualizada?.concluida_em).not.toBeNull();
  expect(missaoAtualizada?.concluida_por).toBe(professor.id);
});

test("missão com prazo vencido e sem entrega aprovada aparece como atrasada", async ({
  page,
}) => {
  const { professor } = lerUsuariosDeTeste();

  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Atrasada E2E ${Date.now()}`,
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await criarMissaoDeTeste(etapa.id, "Missão Vencida", { prazo: ontem });

  await loginViaUI(page, professor);
  await page.goto("/dashboard");

  await expect(page.getByText("Missão Vencida")).toBeVisible();
});
