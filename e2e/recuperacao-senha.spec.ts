import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import { lerUsuariosDeTeste } from "./helpers";

// loginViaUI() (e2e/helpers.ts) espera terminar em /dashboard — só vale
// pra contas com onboarding já concluído (como a conta de aluno
// compartilhada). Uma conta nova de aluno cai em /onboarding primeiro;
// aqui não importa qual das duas, só precisamos de QUALQUER sessão válida.
async function loginSemEsperarDestinoFixo(
  page: Page,
  usuario: { email: string; password: string },
) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(usuario.email);
  await page.getByLabel("Senha").fill(usuario.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/);
}

// DECISIONS.md, "Recuperação de senha implementada": fluxo nativo do
// Supabase Auth (resetPasswordForEmail + updateUser).
//
// Limite real de teste automatizado: o handshake completo (e-mail real ->
// link com código PKCE -> /auth/callback trocando o código por sessão) não
// tem como ser exercitado de ponta a ponta aqui — não há SMTP de teste
// configurado (mesma limitação já registrada para o fluxo de confirmação de
// cadastro), e a API admin `generateLink` NÃO é um substituto válido: ela
// gera um link no formato antigo (tokens no fragmento da URL), não o
// `?code=` que nosso /auth/callback espera quando o pedido parte do nosso
// próprio servidor (que usa @supabase/ssr com flowType 'pkce' por padrão).
// Testar via generateLink estaria validando um fluxo diferente do que a
// aplicação realmente usa. Por isso, o que segue testa: (a) o
// comportamento de não-enumeração em /recuperar-senha, (b) a tela de
// link inválido/expirado quando não há sessão, (c) o tratamento de um
// código inválido no próprio /auth/callback, e (d) o formulário de
// /redefinir-senha de ponta a ponta partindo de uma sessão já autenticada
// (o handshake do token em si é mecanismo interno do Supabase, não código
// desta aplicação).

test("solicitar recuperação mostra a mesma mensagem genérica, exista ou não o e-mail", async ({
  page,
}) => {
  const { aluno } = lerUsuariosDeTeste();
  const MENSAGEM =
    "Se esse e-mail estiver cadastrado, você vai receber um link para redefinir sua senha em instantes.";

  await page.goto("/recuperar-senha");
  await page.getByLabel("E-mail").fill(aluno.email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByTestId("banner-info")).toContainText(MENSAGEM);

  await page.goto("/recuperar-senha");
  await page.getByLabel("E-mail").fill("este.email.nao.existe.e2e@vessia.test");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByTestId("banner-info")).toContainText(MENSAGEM);
});

test("/redefinir-senha sem sessão mostra link inválido/expirado com opção de solicitar um novo", async ({
  browser,
}) => {
  // Contexto limpo, sem cookies de nenhum login anterior do worker.
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("/redefinir-senha");
  await expect(
    page.getByRole("heading", { name: "Link inválido ou expirado" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Solicitar novo link" }),
  ).toHaveAttribute("href", "/recuperar-senha");

  await context.close();
});

test("/auth/callback com código inválido no fluxo de redefinir senha manda para /recuperar-senha com mensagem clara", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(
    "/auth/callback?code=codigo-invalido-de-teste&next=%2Fredefinir-senha",
  );
  await expect(page).toHaveURL(/\/recuperar-senha\?error=/);
  await expect(page.getByTestId("banner-error")).toContainText(
    "Link expirado ou inválido",
  );

  await context.close();
});

test("aluno com sessão ativa redefine a senha pela tela e consegue logar com a nova senha", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const SENHA_ORIGINAL = "senha-teste-vessia-123";
  const SENHA_NOVA = "nova-senha-recuperacao-456";

  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e.recuperacao.${sufixo}@vessia.test`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: SENHA_ORIGINAL,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Falha ao criar aluno de teste: ${error?.message}`);
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: data.user.id,
    nome: "Aluno Recuperação E2E",
    email,
    papel: "aluno",
  });
  if (profileError) {
    throw new Error(`Falha ao criar profile de teste: ${profileError.message}`);
  }

  try {
    // Simula "já chegou aqui via link válido": em vez do handshake de
    // e-mail real (ver nota no topo do arquivo), autentica normalmente e
    // navega direto pra tela — o que a tela e a Server Action fazem a
    // partir daí é exatamente o mesmo código, sessão válida é sessão
    // válida.
    await loginSemEsperarDestinoFixo(page, { email, password: SENHA_ORIGINAL });
    await page.goto("/redefinir-senha");
    await expect(
      page.getByRole("heading", { name: "Redefinir senha" }),
    ).toBeVisible();

    // Confirmação que não bate.
    await page.getByLabel("Nova senha", { exact: true }).fill(SENHA_NOVA);
    await page.getByLabel("Confirmar nova senha").fill("outra-senha-diferente");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(page.getByTestId("banner-error")).toContainText(
      "não coincidem",
    );

    // Agora com confirmação batendo.
    await page.getByLabel("Nova senha", { exact: true }).fill(SENHA_NOVA);
    await page.getByLabel("Confirmar nova senha").fill(SENHA_NOVA);
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await page.waitForURL(/\/login\?message=/);
    await expect(page.getByTestId("banner-info")).toContainText(
      "Senha redefinida com sucesso",
    );

    // A prova real: a senha ANTIGA não funciona mais, a NOVA funciona.
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(SENHA_ORIGINAL);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByTestId("banner-error")).toBeVisible();

    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(SENHA_NOVA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(/\/(dashboard|onboarding)/);
  } finally {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
  }
});
