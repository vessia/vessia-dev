import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";

const SENHA = "senha-teste-vessia-123";

async function cadastrarELogar(
  page: import("@playwright/test").Page,
  papel: "professor" | "aluno",
) {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  // O endpoint público signUp() valida formato/domínio do e-mail de um jeito
  // que o admin API não valida — "@vessia.test" é rejeitado como inválido
  // (TLD reservado pra testes, não é um domínio real). Usa o domínio real
  // do projeto (ver DECISIONS.md) com um local-part óbvio de teste.
  const email = `e2e.cadastro.${papel}.${sufixo}@vessia.com.br`;
  const nome = papel === "professor" ? "Professor Cadastro E2E" : "Aluno Cadastro E2E";

  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  // O radio fica visualmente escondido (sr-only) atrás do label estilizado,
  // então o label intercepta o clique "real" — force bypassa essa checagem
  // de visibilidade, igual um clique de usuário no label faria.
  await page
    .getByLabel(papel === "professor" ? "Professor" : "Aluno")
    .check({ force: true });
  await page.getByRole("button", { name: "Criar conta" }).click();

  await page.waitForURL(/\/(dashboard|login)/);

  if (page.url().includes("/login")) {
    // Confirmação de e-mail está habilitada no projeto — confirma via admin
    // API (não há SMTP de teste configurado) e loga manualmente.
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    const usuario = data.users.find((u) => u.email === email);
    expect(usuario, `usuário ${email} deveria existir após o cadastro`).toBeTruthy();

    await supabaseAdmin.auth.admin.updateUserById(usuario!.id, {
      email_confirm: true,
    });

    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(SENHA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("**/dashboard");
  }

  await expect(page.getByRole("heading", { name: `Olá, ${nome}` })).toBeVisible();

  return { email, nome };
}

test.describe("cadastro e login", () => {
  test("professor consegue se cadastrar e chegar ao dashboard", async ({ page }) => {
    const { email } = await cadastrarELogar(page, "professor");
    await supabaseAdmin.auth.admin.deleteUser(
      (await supabaseAdmin.auth.admin.listUsers()).data.users.find(
        (u) => u.email === email,
      )!.id,
    );
  });

  test("aluno consegue se cadastrar e chegar ao dashboard", async ({ page }) => {
    const { email } = await cadastrarELogar(page, "aluno");
    await supabaseAdmin.auth.admin.deleteUser(
      (await supabaseAdmin.auth.admin.listUsers()).data.users.find(
        (u) => u.email === email,
      )!.id,
    );
  });
});

test.describe("proteção de rotas", () => {
  test("acessar /dashboard sem sessão redireciona para /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("acessar /projetos sem sessão redireciona para /login", async ({ page }) => {
    await page.goto("/projetos");
    await expect(page).toHaveURL(/\/login\?next=%2Fprojetos/);
  });
});
