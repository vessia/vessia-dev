import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import {
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

// DECISIONS.md, "Confirmação antes de sair de um projeto".

test("cancelar a confirmação mantém o aluno no projeto", async ({ page }) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const nomeProjeto = `Projeto Confirmar Saida Cancela E2E ${Date.now()}`;
  const projeto = await criarProjetoDeTeste(professor.id, nomeProjeto, {
    alunoAceitoId: aluno.id,
  });

  try {
    page.once("dialog", (dialog) => dialog.dismiss());

    await loginViaUI(page, aluno);
    await page.goto(`/projetos/${projeto.slug}`);
    await page.getByRole("button", { name: "Sair do projeto" }).click();

    // Permanece na mesma página, sem sair — a Server Action nunca chegou a
    // ser chamada porque o form nem chegou a submeter.
    await expect(page).toHaveURL(`/projetos/${projeto.slug}`);
    await expect(
      page.getByRole("button", { name: "Sair do projeto" }),
    ).toBeVisible();

    const { data } = await supabaseAdmin
      .from("projeto_alunos")
      .select("status")
      .eq("projeto_id", projeto.id)
      .eq("aluno_id", aluno.id)
      .single();
    expect(data?.status).toBe("aceito");
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});

test("confirmar a saída mostra o texto certo no dialog e executa a ação", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const nomeProjeto = `Projeto Confirmar Saida Aceita E2E ${Date.now()}`;
  const projeto = await criarProjetoDeTeste(professor.id, nomeProjeto, {
    alunoAceitoId: aluno.id,
  });

  try {
    let mensagemDialog = "";
    page.once("dialog", (dialog) => {
      mensagemDialog = dialog.message();
      dialog.accept();
    });

    await loginViaUI(page, aluno);
    await page.goto(`/projetos/${projeto.slug}`);
    await page.getByRole("button", { name: "Sair do projeto" }).click();

    await page.waitForURL("**/projetos");

    expect(mensagemDialog).toContain(nomeProjeto);
    expect(mensagemDialog).toContain("perde acesso a novas missões");

    const { data } = await supabaseAdmin
      .from("projeto_alunos")
      .select("status")
      .eq("projeto_id", projeto.id)
      .eq("aluno_id", aluno.id)
      .single();
    expect(data?.status).toBe("saiu");
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});
