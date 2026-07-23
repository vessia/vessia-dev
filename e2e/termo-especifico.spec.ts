import { expect, test } from "@playwright/test";
import {
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";
import { supabaseAdmin } from "./supabase-admin";

const TEXTO_TERMO =
  "Este trabalho não tem caráter trabalhista, não prevê remuneração e é de natureza pedagógica.";

// DECISIONS.md, "Aceite do termo específico vira gate de projeto, não
// embutido numa missão": pelo menos um aluno confundiu o botão de aceitar
// o termo com o de enviar entrega, porque os dois apareciam na mesma tela
// (a missão). Agora o aceite é um gate isolado, no nível do projeto,
// disparado assim que o aluno tenta acessar qualquer conteúdo dele (mapa,
// etapa ou missão) — não mais atrelado à tentativa de participar de uma
// missão específica.

test("aluno com termo pendente é redirecionado pro gate isolado ao acessar o mapa do projeto", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Termo Gate Mapa E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id, termoEspecifico: TEXTO_TERMO },
  );

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projeto.slug}`);

  await expect(page).toHaveURL(`/projetos/${projeto.slug}/aceitar-termo`);
  await expect(page.getByText("Termo específico deste projeto")).toBeVisible();
  await expect(page.getByText(TEXTO_TERMO)).toBeVisible();
  await expect(page.getByRole("button", { name: "Li e concordo" })).toBeVisible();

  // Tela isolada: nenhum outro elemento de ação — nem navegação de
  // projeto, nem nada que lembre o fluxo de missão/entrega.
  await expect(page.getByRole("button", { name: "Participar" })).toHaveCount(0);
  await expect(page.getByText("Enviar entrega")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Editar projeto" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sair do projeto" })).toHaveCount(0);
  await expect(page.getByText("Etapas")).toHaveCount(0);
});

test("aluno com termo pendente é redirecionado pro gate ao acessar uma etapa diretamente", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Termo Gate Etapa E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id, termoEspecifico: TEXTO_TERMO },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);

  await expect(page).toHaveURL(`/projetos/${projeto.slug}/aceitar-termo`);
  await expect(page.getByRole("button", { name: "Li e concordo" })).toBeVisible();
});

test("aluno com termo pendente é redirecionado pro gate ao acessar uma missão diretamente, sem criar participação", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Termo Gate Missao E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id, termoEspecifico: TEXTO_TERMO },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Termo Bloqueada");

  await loginViaUI(page, aluno);
  await page.goto(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`,
  );

  await expect(page).toHaveURL(`/projetos/${projeto.slug}/aceitar-termo`);
  await expect(page.getByRole("button", { name: "Participar" })).toHaveCount(0);

  const { count } = await supabaseAdmin
    .from("participacoes")
    .select("*", { count: "exact", head: true })
    .eq("missao_id", missao.id)
    .eq("aluno_id", aluno.id);
  expect(count).toBe(0);
});

test("aluno participa normalmente quando o projeto não define termo específico (sem gate nenhum)", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Sem Termo E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Sem Termo");

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projeto.slug}`);
  await expect(page).toHaveURL(`/projetos/${projeto.slug}`);

  await page.goto(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`,
  );
  await expect(page).toHaveURL(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`,
  );
  await expect(page.getByRole("button", { name: "Participar" })).toBeVisible();

  await page.getByRole("button", { name: "Participar" }).click();
  await expect(page.getByText("Enviar entrega")).toBeVisible();
});

test("aceitar o termo no gate registra a data, leva pro mapa do projeto, e não pede de novo em nenhuma outra rota do mesmo projeto", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Termo Aceito E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id, termoEspecifico: TEXTO_TERMO },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Termo Depois");

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projeto.slug}`);
  await expect(page).toHaveURL(`/projetos/${projeto.slug}/aceitar-termo`);

  await page.getByRole("button", { name: "Li e concordo" }).click();
  await expect(page).toHaveURL(`/projetos/${projeto.slug}`);
  await expect(page.getByText("Etapas")).toBeVisible();

  const { data: vinculo } = await supabaseAdmin
    .from("projeto_alunos")
    .select("termo_aceito_em")
    .eq("projeto_id", projeto.id)
    .eq("aluno_id", aluno.id)
    .single();
  expect(vinculo?.termo_aceito_em).toBeTruthy();

  // Já aceito — acessar a etapa e a missão direto não volta pro gate.
  await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);
  await expect(page).toHaveURL(`/projetos/${projeto.slug}/etapas/${etapa.slug}`);

  await page.goto(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`,
  );
  await expect(page).toHaveURL(
    `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`,
  );
  await expect(page.getByRole("button", { name: "Participar" })).toBeVisible();
});

test("professor nunca vê o gate de termo, mesmo em projeto com termo específico pendente pro aluno", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Termo Professor E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id, termoEspecifico: TEXTO_TERMO },
  );

  await loginViaUI(page, professor);
  await page.goto(`/projetos/${projeto.slug}`);

  await expect(page).toHaveURL(`/projetos/${projeto.slug}`);
  await expect(page.getByText("Etapas")).toBeVisible();
});
