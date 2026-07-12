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

test("aluno não vê 'Participar' sem aceitar o termo específico do projeto, e nenhuma participação é criada", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Termo Bloqueado E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id, termoEspecifico: TEXTO_TERMO },
  );
  const etapaId = await criarEtapaDeTeste(projetoId, "Descoberta", 1);
  const missaoId = await criarMissaoDeTeste(etapaId, "Missão Termo Bloqueado");

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoId}`);

  await expect(page.getByText("Termo específico deste projeto")).toBeVisible();
  await expect(page.getByText(TEXTO_TERMO)).toBeVisible();
  await expect(page.getByRole("button", { name: "Li e concordo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Participar" })).toHaveCount(0);

  const { count } = await supabaseAdmin
    .from("participacoes")
    .select("*", { count: "exact", head: true })
    .eq("missao_id", missaoId)
    .eq("aluno_id", aluno.id);
  expect(count).toBe(0);
});

test("aluno participa normalmente quando o projeto não define termo específico", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Sem Termo E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapaId = await criarEtapaDeTeste(projetoId, "Descoberta", 1);
  const missaoId = await criarMissaoDeTeste(etapaId, "Missão Sem Termo");

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoId}`);

  await expect(page.getByText("Termo específico deste projeto")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Participar" })).toBeVisible();

  await page.getByRole("button", { name: "Participar" }).click();
  await expect(page.getByText("Enviar entrega")).toBeVisible();
});

test("aceitar o termo registra a data, libera a participação, e não pede de novo em outra missão do mesmo projeto", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Termo Aceito E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id, termoEspecifico: TEXTO_TERMO },
  );
  const etapaId = await criarEtapaDeTeste(projetoId, "Descoberta", 1);
  const missaoAId = await criarMissaoDeTeste(etapaId, "Missão Termo A");
  const missaoBId = await criarMissaoDeTeste(etapaId, "Missão Termo B");

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoAId}`);

  await expect(page.getByRole("button", { name: "Li e concordo" })).toBeVisible();
  await page.getByRole("button", { name: "Li e concordo" }).click();

  // Depois do aceite, a mesma missão já libera "Participar" normalmente.
  await expect(page.getByRole("button", { name: "Participar" })).toBeVisible();
  await expect(page.getByText("Termo específico deste projeto")).toHaveCount(0);

  const { data: vinculo } = await supabaseAdmin
    .from("projeto_alunos")
    .select("termo_aceito_em")
    .eq("projeto_id", projetoId)
    .eq("aluno_id", aluno.id)
    .single();
  expect(vinculo?.termo_aceito_em).toBeTruthy();

  await page.getByRole("button", { name: "Participar" }).click();
  await expect(page.getByText("Enviar entrega")).toBeVisible();

  // Aceite é por projeto, não por missão — a segunda missão do MESMO
  // projeto já libera "Participar" direto, sem pedir o termo de novo.
  await page.goto(`/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoBId}`);
  await expect(page.getByText("Termo específico deste projeto")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Participar" })).toBeVisible();
});
