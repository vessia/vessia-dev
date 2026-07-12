import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";

const SENHA = "senha-teste-vessia-123";

test("cadastro é bloqueado sem marcar a caixa de aceite dos Termos", async ({
  page,
}) => {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  // Mesmo domínio real usado em auth.spec.ts — signUp() público rejeita
  // "@vessia.test" como TLD inválido.
  const email = `e2e.termos.bloqueado.${sufixo}@vessia.com.br`;

  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Aluno Termos Bloqueado E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  // Checkbox propositalmente não marcada. Remove o `required` do HTML antes
  // de submeter — sem isso o navegador bloqueia o envio sozinho (validação
  // nativa) e o teste nunca chegaria a exercitar a segunda camada de
  // verdade, a Server Action (duas camadas, mesmo padrão do resto do app).
  await page.evaluate(() => {
    document
      .querySelector('input[name="aceite_termos"]')
      ?.removeAttribute("required");
  });
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page).toHaveURL(/\/cadastro\?error=/);
  await expect(page.getByTestId("banner-error")).toContainText(
    "É preciso concordar com os Termos de Uso",
  );

  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const usuario = data.users.find((u) => u.email === email);
  expect(usuario, "cadastro bloqueado não deveria ter criado usuário nenhum").toBeFalsy();
});

test("cadastro com a caixa marcada registra o aceite dos Termos com data/hora", async ({
  page,
}) => {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e.termos.aceito.${sufixo}@vessia.com.br`;

  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Aluno Termos Aceito E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar conta" }).click();

  await page.waitForURL(/\/(dashboard|onboarding|login)/);

  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const usuario = data.users.find((u) => u.email === email);
  expect(usuario, `usuário ${email} deveria existir após o cadastro`).toBeTruthy();

  try {
    const { data: perfil } = await supabaseAdmin
      .from("profiles")
      .select("termos_aceitos_em")
      .eq("id", usuario!.id)
      .single();
    expect(perfil?.termos_aceitos_em).toBeTruthy();
  } finally {
    await supabaseAdmin.auth.admin.deleteUser(usuario!.id);
  }
});
