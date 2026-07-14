import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import {
  criarEtapaDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

// Item 2 da rodada de correções pós-teste real (Bíblia 3D): acessar um
// projeto sem vínculo mostrava o 404 padrão do Next.js. A mensagem é
// propositalmente ambígua entre "não existe" e "você não tem acesso", pra
// não vazar a existência de projetos pra quem não deveria saber.

test("projeto inexistente mostra página amigável (não o 404 padrão do Next.js)", async ({
  page,
}) => {
  const { professor } = lerUsuariosDeTeste();
  await loginViaUI(page, professor);

  const resposta = await page.goto("/projetos/projeto-que-nao-existe");
  expect(resposta?.status()).toBe(404);
  await expect(
    page.getByText("Este projeto não foi encontrado ou você não tem acesso a ele."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Voltar para projetos" }),
  ).toHaveAttribute("href", "/projetos");
});

test("professor sem vínculo tentando ver etapa de outro projeto vê a mesma página amigável", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Sem Acesso E2E ${Date.now()}`,
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);

  try {
    // Aluno de teste não está vinculado a este projeto — RLS já barra a
    // leitura, então a rota aninhada (etapa) precisa cair na mesma página
    // amigável, não em um 404 "cru" ou numa tela quebrada.
    await loginViaUI(page, aluno);
    const resposta = await page.goto(
      `/projetos/${projeto.slug}/etapas/${etapa.slug}`,
    );
    expect(resposta?.status()).toBe(404);
    await expect(
      page.getByText(
        "Este projeto não foi encontrado ou você não tem acesso a ele.",
      ),
    ).toBeVisible();
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});
