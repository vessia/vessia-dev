import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import {
  criarEtapaDeTeste,
  criarProjetoDeTeste,
  criarParticipacaoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

// Item 4 da rodada de correções pós-teste real (Bíblia 3D):
// docs/DECISIONS.md, "Missão pode ter vagas ilimitadas".
const SENHA = "senha-teste-vessia-123";

async function criarAlunoAvulsoDeTeste(nome: string) {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e.vagas.${sufixo}@vessia.test`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Falha ao criar aluno avulso de teste: ${error?.message}`);
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: data.user.id,
    nome,
    email,
    papel: "aluno",
  });

  if (profileError) {
    throw new Error(`Falha ao criar profile avulso de teste: ${profileError.message}`);
  }

  return data.user.id as string;
}

test("professor cria missão com vagas em branco e ela fica ilimitada, sem barrar novas participações", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Vagas Ilimitadas E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const outrosAlunos: string[] = [];

  try {
    // Professor cria a missão pela UI, deixando "Vagas" em branco.
    await loginViaUI(page, professor);
    await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/nova`);
    await page.getByLabel("Título").fill("Missão Sem Limite");
    await page.getByLabel("Tipo").selectOption("estudar");
    await page.getByLabel("Objetivo").fill("Objetivo de teste.");
    await page.getByLabel("Entrega esperada").fill("Entrega de teste.");
    await page.getByLabel("Critério de avaliação").fill("Critério de teste.");
    await page
      .getByLabel("Vagas (deixe em branco para sem limite)")
      .fill("");
    await page.getByRole("button", { name: "Salvar" }).click();
    await page.waitForURL(`**/projetos/${projeto.slug}/etapas/${etapa.slug}`);

    await expect(page.getByText(/Estudar · Vagas ilimitadas/)).toBeVisible();

    const { data: missao } = await supabaseAdmin
      .from("missoes")
      .select("id, slug, vagas")
      .eq("etapa_id", etapa.id)
      .eq("titulo", "Missão Sem Limite")
      .single();
    expect(missao?.vagas).toBeNull();

    const missaoId = missao!.id as string;
    const missaoSlug = missao!.slug as string;

    // Simula bem mais participações do que qualquer teto normal (3 alunos
    // avulsos) — se houvesse teto, a quarta participação (o aluno de teste
    // compartilhado, via UI) seria barrada por "vagas esgotadas".
    for (let i = 0; i < 3; i++) {
      const outroId = await criarAlunoAvulsoDeTeste(`Aluno Extra ${i} E2E`);
      outrosAlunos.push(outroId);
      await criarParticipacaoDeTeste(missaoId, outroId);
    }

    await loginViaUI(page, aluno);
    await page.goto(
      `/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missaoSlug}`,
    );
    await expect(page.getByText("3 participando (sem limite)")).toBeVisible();
    await expect(page.getByText("Vagas esgotadas")).toHaveCount(0);

    await page.getByRole("button", { name: "Participar" }).click();
    await expect(page.getByText("4 participando (sem limite)")).toBeVisible();
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
    for (const id of outrosAlunos) {
      await supabaseAdmin.auth.admin.deleteUser(id);
    }
  }
});
