import { expect, test } from "@playwright/test";
import { lerUsuariosDeTeste, loginViaUI } from "./helpers";

// Item 1 da preparação pré-lançamento: mensagem amigável de acesso
// negado/não encontrado em qualquer rota, não só dentro de /projetos/[id]
// (que já tinha seu próprio not-found.tsx mais específico).

test("URL inexistente mostra a página amigável global, não o 404 padrão do Next.js", async ({
  page,
}) => {
  const { professor } = lerUsuariosDeTeste();
  await loginViaUI(page, professor);

  const resposta = await page.goto("/essa-rota-nao-existe-e2e");
  expect(resposta?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Voltar para o início" }),
  ).toHaveAttribute("href", "/");
});

test("avaliação inexistente mostra a página amigável global (não o 404 padrão do Next.js)", async ({
  page,
}) => {
  const { professor } = lerUsuariosDeTeste();
  await loginViaUI(page, professor);

  const resposta = await page.goto(
    "/avaliacoes/00000000-0000-0000-0000-000000000000",
  );
  expect(resposta?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
});
