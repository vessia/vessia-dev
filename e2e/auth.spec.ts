import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import { lerUsuariosDeTeste, loginViaUI } from "./helpers";

const SENHA = "senha-teste-vessia-123";

// Cadastro público só cria conta de Aluno (ver DECISIONS.md) — não existe
// mais opção de papel na tela, e não faz sentido testar criação de
// Professor por essa rota.
async function cadastrarELogarAluno(page: import("@playwright/test").Page) {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  // O endpoint público signUp() valida formato/domínio do e-mail de um jeito
  // que o admin API não valida — "@vessia.test" é rejeitado como inválido
  // (TLD reservado pra testes, não é um domínio real). Usa o domínio real
  // do projeto (ver DECISIONS.md) com um local-part óbvio de teste.
  const email = `e2e.cadastro.aluno.${sufixo}@vessia.com.br`;
  const nome = "Aluno Cadastro E2E";

  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("checkbox").check();
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

  // Aluno novo (0 de 3 itens de onboarding) é redirecionado antes de ver o
  // dashboard "Olá, {nome}".
  await page.waitForURL("**/onboarding");
  await expect(
    page.getByRole("heading", { name: "Bem-vindo à Empresa Júnior" }),
  ).toBeVisible();

  return { email, nome };
}

test.describe("cadastro e login", () => {
  test("aluno consegue se cadastrar e chegar ao onboarding", async ({ page }) => {
    const { email } = await cadastrarELogarAluno(page);
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

test.describe("landing (/)", () => {
  test("visitante sem sessão vê a landing de marketing", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "Projetos reais, organizados em missões claras" }),
    ).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Entrar" })).toBeVisible();
  });

  test("usuário autenticado é redirecionado direto para /dashboard", async ({ page }) => {
    const { aluno } = lerUsuariosDeTeste();
    await loginViaUI(page, aluno);

    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
