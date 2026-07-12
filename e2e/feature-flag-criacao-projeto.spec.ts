import { expect, test } from "@playwright/test";
import { lerUsuariosDeTeste, loginViaUI } from "./helpers";
import { supabaseAdmin } from "./supabase-admin";

// Este spec só faz sentido rodando contra um servidor com
// CRIACAO_PROJETO_HABILITADA=false — ver instruções de execução no
// TECH-DEBT.md / relatado ao Gestor no chat. Não faz parte da suíte
// padrão porque exige essa variável de ambiente específica no processo
// do servidor (não dá pra setar por teste individual).
test("com a flag desligada, criar projeto é bloqueado na action mesmo indo direto no form, em qualquer lugar da UI e sem criar nada no banco", async ({
  page,
}) => {
  const { professor } = lerUsuariosDeTeste();
  const nomeProjeto = `Projeto Flag Desligada E2E ${Date.now()}`;

  await loginViaUI(page, professor);

  // Header não deve nem oferecer o link.
  await expect(page.getByRole("link", { name: "Novo projeto" })).toHaveCount(0);

  // Lista de projetos mostra a mensagem discreta, não o botão.
  await page.goto("/projetos");
  await expect(
    page.getByText("Criação de projetos temporariamente desativada"),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Novo projeto" })).toHaveCount(0);

  // Indo direto na URL do formulário (bypassando a UI que esconde o link)
  // e submetendo de verdade — a Server Action tem que bloquear sozinha.
  await page.goto("/projetos/novo");
  await page.getByLabel("Nome").fill(nomeProjeto);
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page).toHaveURL(/\/projetos\/novo\?error=/);
  await expect(page.getByTestId("banner-error")).toContainText(
    "Criação de novos projetos está temporariamente desativada.",
  );

  const { data } = await supabaseAdmin
    .from("projetos")
    .select("id")
    .eq("nome", nomeProjeto);
  expect(data ?? []).toHaveLength(0);
});
