import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import { lerUsuariosDeTeste, loginViaUI } from "./helpers";

const SENHA = "senha-teste-vessia-123";

async function criarAlunoVirgemDeTeste() {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e.onboarding.${sufixo}@vessia.test`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Falha ao criar aluno de teste: ${error?.message}`);
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: data.user.id,
    nome: "Aluno Onboarding E2E",
    email,
    papel: "aluno",
  });

  if (profileError) {
    throw new Error(`Falha ao criar profile de teste: ${profileError.message}`);
  }

  // Sem nenhuma linha em onboarding_progresso — aluno "virgem" de propósito,
  // diferente da conta compartilhada de e2e/global-setup.ts.
  return { id: data.user.id, email, password: SENHA };
}

test("aluno novo é redirecionado pro onboarding antes de ver /projetos, e completa a trilha pela UI", async ({
  page,
}) => {
  const aluno = await criarAlunoVirgemDeTeste();

  try {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(aluno.email);
    await page.getByLabel("Senha").fill(aluno.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    // Login redireciona pro dashboard, que redireciona pro onboarding
    // (0 de 3 itens concluídos) — nunca chega a resolver em /dashboard.
    await page.waitForURL("**/onboarding");

    // Acesso direto a /projetos também é bloqueado enquanto não completar.
    await page.goto("/projetos");
    await expect(page).toHaveURL(/\/onboarding/);

    await page.goto("/onboarding");

    await expect(page.getByText("Conheça a Vessia")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Marcar como concluído" }),
    ).toHaveCount(1);

    // Item 1.
    await page.getByRole("button", { name: "Marcar como concluído" }).click();
    await page.waitForURL("**/onboarding");
    await expect(
      page.getByRole("button", { name: "Marcar como concluído" }),
    ).toHaveCount(1);

    // Item 2.
    await page.getByRole("button", { name: "Marcar como concluído" }).click();
    await page.waitForURL("**/onboarding");
    await expect(
      page.getByRole("button", { name: "Marcar como concluído" }),
    ).toHaveCount(1);

    // Item 3 — depois desse, nenhum "Marcar" deve sobrar.
    await page.getByRole("button", { name: "Marcar como concluído" }).click();
    await page.waitForURL("**/onboarding");
    await expect(
      page.getByRole("button", { name: "Marcar como concluído" }),
    ).toHaveCount(0);

    await page.getByRole("link", { name: "Continuar" }).click();
    await page.waitForURL("**/projetos");
  } finally {
    await supabaseAdmin.auth.admin.deleteUser(aluno.id);
  }
});

test("professor não é bloqueado pelo onboarding", async ({ page }) => {
  const { professor } = lerUsuariosDeTeste();

  await loginViaUI(page, professor);
  await page.goto("/projetos");
  await expect(page).toHaveURL(/\/projetos$/);
});

test("aluno que já completou o onboarding revisita em modo leitura via 'Rever onboarding', sem ficar bloqueado", async ({
  page,
}) => {
  // Conta compartilhada de e2e/global-setup.ts já tem os 3 itens
  // pré-concluídos — é exatamente o cenário "já completou" de DECISIONS.md
  // ("Onboarding passa a ser revisável, não só um gate único").
  const { aluno } = lerUsuariosDeTeste();
  await loginViaUI(page, aluno);

  await page.getByRole("link", { name: "Rever onboarding" }).click();
  await page.waitForURL("**/onboarding");

  await expect(page.getByText("Conheça a Vessia")).toBeVisible();
  await expect(page.getByText("Como funcionam as missões")).toBeVisible();
  await expect(
    page.getByText("Como entregar e como funciona a aprovação"),
  ).toBeVisible();

  // Modo leitura: os 3 já aparecem concluídos, nenhum botão de ação sobra.
  await expect(
    page.getByRole("button", { name: "Marcar como concluído" }),
  ).toHaveCount(0);
  await expect(page.getByText("Concluído").first()).toBeVisible();

  // Não é bloqueante — continua navegando pro resto do app normalmente.
  await page.goto("/projetos");
  await expect(page).toHaveURL(/\/projetos$/);
});
