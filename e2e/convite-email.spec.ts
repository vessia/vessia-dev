import { expect, test, type Page } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import { criarProjetoDeTeste, lerUsuariosDeTeste, loginViaUI } from "./helpers";

// DECISIONS.md, "Convite por e-mail para aluno não cadastrado ainda": convite
// por e-mail atribui na hora se já existe conta de aluno com esse e-mail, ou
// cria uma pendência (convites_email_pendentes) resolvida automaticamente no
// cadastro público.

const SENHA = "senha-teste-vessia-123";

async function criarUsuarioAvulsoDeTeste(
  papel: "professor" | "aluno",
  nome: string,
) {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e.convite.${papel}.${sufixo}@vessia.test`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Falha ao criar ${papel} avulso de teste: ${error?.message}`);
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: data.user.id,
    nome,
    email,
    papel,
  });

  if (profileError) {
    throw new Error(
      `Falha ao criar profile avulso de teste (${papel}): ${profileError.message}`,
    );
  }

  return { id: data.user.id, email, password: SENHA, nome, papel };
}

// Igual à cadastrarELogarAluno de auth.spec.ts, mas parametrizada por e-mail
// (aqui o e-mail importa — precisa bater com o convite pendente semeado) e
// devolvendo o id do usuário criado, pra checar vínculos depois.
async function cadastrarPublico(page: Page, email: string, nome: string) {
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar conta" }).click();

  await page.waitForURL(/\/(dashboard|login)/);

  if (page.url().includes("/login")) {
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

  await page.waitForURL("**/onboarding");

  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const usuario = data.users.find((u) => u.email === email);
  if (!usuario) {
    throw new Error(`usuário ${email} não encontrado após cadastro`);
  }
  return usuario.id;
}

test("professor convida por e-mail uma conta já existente e o vínculo é criado na hora", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Convite Email Existente E2E ${Date.now()}`,
  );
  const alunoAvulso = await criarUsuarioAvulsoDeTeste(
    "aluno",
    `Aluno Convite Email E2E ${Date.now()}`,
  );

  try {
    await loginViaUI(page, professor);
    await page.goto(`/projetos/${projeto.slug}/alunos`);
    await page.getByLabel("Convidar por e-mail").fill(alunoAvulso.email);
    await page.getByRole("button", { name: "Convidar" }).click();

    await expect(page.getByTestId("banner-info")).toContainText("Aluno convidado.");
    await expect(
      page.locator("li", { hasText: alunoAvulso.nome }),
    ).toContainText("Convidado (aguardando resposta)");

    const { data } = await supabaseAdmin
      .from("projeto_alunos")
      .select("status")
      .eq("projeto_id", projeto.id)
      .eq("aluno_id", alunoAvulso.id)
      .single();
    expect(data?.status).toBe("convidado");
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
    await supabaseAdmin.auth.admin.deleteUser(alunoAvulso.id);
  }
});

test("professor convida por e-mail sem conta e fica registrada uma pendência", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Convite Email Pendente E2E ${Date.now()}`,
  );
  const email = `e2e.convite.pendente.${Date.now()}@vessia.com.br`;

  try {
    await loginViaUI(page, professor);
    await page.goto(`/projetos/${projeto.slug}/alunos`);
    await page.getByLabel("Convidar por e-mail").fill(email);
    await page.getByRole("button", { name: "Convidar" }).click();

    await expect(page.getByTestId("banner-info")).toContainText(
      "Convite registrado — será aplicado automaticamente quando esse e-mail se cadastrar.",
    );

    const { data } = await supabaseAdmin
      .from("convites_email_pendentes")
      .select("email, resolvido_em")
      .eq("projeto_id", projeto.id)
      .ilike("email", email)
      .maybeSingle();

    expect(data).toBeTruthy();
    expect(data?.resolvido_em).toBeNull();
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto.id);
  }
});

test("cadastro com e-mail que tem convites pendentes em mais de um projeto resolve todos automaticamente", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor } = lerUsuariosDeTeste();
  const email = `e2e.convite.cadastro.${Date.now()}@vessia.com.br`;
  const projeto1 = await criarProjetoDeTeste(
    professor.id,
    `Projeto Convite Cadastro 1 E2E ${Date.now()}`,
  );
  const projeto2 = await criarProjetoDeTeste(
    professor.id,
    `Projeto Convite Cadastro 2 E2E ${Date.now()}`,
  );

  const { error: convite1Error } = await supabaseAdmin
    .from("convites_email_pendentes")
    .insert({ projeto_id: projeto1.id, email, convidado_por: professor.id });
  const { error: convite2Error } = await supabaseAdmin
    .from("convites_email_pendentes")
    .insert({ projeto_id: projeto2.id, email, convidado_por: professor.id });

  if (convite1Error || convite2Error) {
    throw new Error(
      `Falha ao semear convites pendentes: ${convite1Error?.message ?? convite2Error?.message}`,
    );
  }

  let novoAlunoId: string | undefined;
  try {
    novoAlunoId = await cadastrarPublico(page, email, "Aluno Convite Cadastro E2E");

    const { data: vinculos } = await supabaseAdmin
      .from("projeto_alunos")
      .select("projeto_id, status")
      .eq("aluno_id", novoAlunoId);

    expect(vinculos?.find((v) => v.projeto_id === projeto1.id)?.status).toBe(
      "convidado",
    );
    expect(vinculos?.find((v) => v.projeto_id === projeto2.id)?.status).toBe(
      "convidado",
    );

    const { data: convites } = await supabaseAdmin
      .from("convites_email_pendentes")
      .select("projeto_id, resolvido_em")
      .in("projeto_id", [projeto1.id, projeto2.id]);

    expect(convites?.length).toBe(2);
    expect(convites?.every((c) => c.resolvido_em !== null)).toBe(true);
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projeto1.id);
    await supabaseAdmin.from("projetos").delete().eq("id", projeto2.id);
    if (novoAlunoId) {
      await supabaseAdmin.auth.admin.deleteUser(novoAlunoId);
    }
  }
});

test("cadastro com e-mail sem nenhum convite pendente não cria nenhum vínculo de projeto", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const email = `e2e.convite.semconvite.${Date.now()}@vessia.com.br`;

  let novoAlunoId: string | undefined;
  try {
    novoAlunoId = await cadastrarPublico(page, email, "Aluno Sem Convite E2E");

    const { count } = await supabaseAdmin
      .from("projeto_alunos")
      .select("*", { count: "exact", head: true })
      .eq("aluno_id", novoAlunoId);

    expect(count).toBe(0);
  } finally {
    if (novoAlunoId) {
      await supabaseAdmin.auth.admin.deleteUser(novoAlunoId);
    }
  }
});
