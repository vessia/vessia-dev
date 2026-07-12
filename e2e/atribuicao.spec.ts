import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import {
  adicionarColaboradorDeTeste,
  atribuirAlunoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";

// Bloco 12 — 05 - Fluxos.md §2.1: adicionar colaborador, atribuir aluno,
// aceitar/recusar convite, sair do projeto, remover aluno.

const SENHA = "senha-teste-vessia-123";

async function criarUsuarioAvulsoDeTeste(
  papel: "professor" | "aluno",
  nome: string,
) {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e.atrib.${papel}.${sufixo}@vessia.test`;

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
    papel,
  });

  if (profileError) {
    throw new Error(
      `Falha ao criar profile avulso de teste (${papel}): ${profileError.message}`,
    );
  }

  return { id: data.user.id, email, password: SENHA, nome, papel };
}

test("proprietário adiciona colaborador pela UI, e o colaborador passa a editar o projeto", async ({
  page,
}) => {
  // Dois logins reais + várias navegações/round-trips: acima do orçamento
  // padrão de 30s deste ambiente (mesmo padrão do mvp-completo.spec.ts).
  test.setTimeout(60_000);
  const { professor } = lerUsuariosDeTeste();
  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Colaborador E2E ${Date.now()}`,
  );
  const colaborador = await criarUsuarioAvulsoDeTeste(
    "professor",
    `Colaborador Atribuicao E2E ${Date.now()}`,
  );

  try {
    await loginViaUI(page, professor);
    await page.goto(`/projetos/${projetoId}/professores`);
    await page.getByLabel("Buscar professor por nome").fill(colaborador.nome);
    await page.getByRole("button", { name: "Buscar" }).click();
    await page
      .getByRole("listitem")
      .filter({ hasText: colaborador.nome })
      .getByRole("button", { name: "Adicionar" })
      .click();

    await expect(
      page.locator("li", { hasText: colaborador.nome }),
    ).toContainText("Colaborador");

    // Colaborador de verdade: consegue ver e editar o projeto, não só
    // aparecer na lista — RLS (eh_professor_do_projeto) cobre proprietário
    // OU colaborador igualmente.
    await loginViaUI(page, colaborador);
    await page.goto(`/projetos/${projetoId}`);
    await expect(
      page.getByRole("link", { name: "Editar projeto" }),
    ).toBeVisible();
    // Só o proprietário gerencia professores — colaborador não vê o link.
    await expect(
      page.getByRole("link", { name: "Professores" }),
    ).toHaveCount(0);

    await page.goto(`/projetos/${projetoId}/etapas/nova`);
    await page.getByLabel("Nome").fill("Etapa Criada Pelo Colaborador");
    await page.getByLabel("Ordem").fill("1");
    await page.getByRole("button", { name: "Salvar" }).click();
    await page.waitForURL(`**/projetos/${projetoId}`);
    await expect(
      page.getByText("Etapa Criada Pelo Colaborador"),
    ).toBeVisible();
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projetoId);
    await supabaseAdmin.auth.admin.deleteUser(colaborador.id);
  }
});

test("proprietário remove colaborador e ele perde o acesso ao projeto", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor } = lerUsuariosDeTeste();
  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Remover Colaborador E2E ${Date.now()}`,
  );
  const colaborador = await criarUsuarioAvulsoDeTeste(
    "professor",
    `Colaborador Removido E2E ${Date.now()}`,
  );
  await adicionarColaboradorDeTeste(projetoId, colaborador.id, professor.id);

  try {
    await loginViaUI(page, professor);
    await page.goto(`/projetos/${projetoId}/professores`);
    await expect(page.getByText(colaborador.nome)).toBeVisible();
    await page
      .getByRole("listitem")
      .filter({ hasText: colaborador.nome })
      .getByRole("button", { name: "Remover" })
      .click();
    await expect(page.getByText(colaborador.nome)).toHaveCount(0);

    // Sem vínculo, a RLS bloqueia até a leitura do projeto — a página some
    // (404), não sobra um "casco" vazio de etapas.
    await loginViaUI(page, colaborador);
    const resposta = await page.goto(`/projetos/${projetoId}`);
    expect(resposta?.status()).toBe(404);
  } finally {
    await supabaseAdmin.from("projetos").delete().eq("id", projetoId);
    await supabaseAdmin.auth.admin.deleteUser(colaborador.id);
  }
});

test("professor atribui aluno pela UI, aluno vê o convite no dashboard e aceita", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor, aluno } = lerUsuariosDeTeste();
  const nomeProjeto = `Projeto Atribuir Aluno E2E ${Date.now()}`;
  const projetoId = await criarProjetoDeTeste(professor.id, nomeProjeto);

  await loginViaUI(page, professor);
  await page.goto(`/projetos/${projetoId}/alunos`);
  await page.getByLabel("Buscar aluno por nome").fill(aluno.nome);
  await page.getByRole("button", { name: "Buscar" }).click();
  await page
    .getByRole("listitem")
    .filter({ hasText: aluno.nome })
    .getByRole("button", { name: "Atribuir" })
    .click();
  await expect(
    page.getByText("Convidado (aguardando resposta)"),
  ).toBeVisible();

  await loginViaUI(page, aluno);
  await page.goto("/dashboard");
  await expect(page.getByText(nomeProjeto)).toBeVisible();
  await page.getByRole("button", { name: "Aceitar" }).click();
  await page.waitForURL("**/dashboard");

  // Depois de aceitar, o projeto aparece normalmente (conteúdo visível, sem
  // banner de convite pendente).
  await page.goto(`/projetos/${projetoId}`);
  await expect(page.getByText("Etapas")).toBeVisible();
  await expect(page.getByTestId("banner-info")).toHaveCount(0);
});

test("aluno recusa o convite e vê mensagem informativa na página do projeto", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor, aluno } = lerUsuariosDeTeste();
  const nomeProjeto = `Projeto Recusar Convite E2E ${Date.now()}`;
  const projetoId = await criarProjetoDeTeste(professor.id, nomeProjeto);
  await atribuirAlunoDeTeste(projetoId, aluno.id, professor.id);

  await loginViaUI(page, aluno);
  await page.goto("/dashboard");
  await expect(page.getByText(nomeProjeto)).toBeVisible();
  await page.getByRole("button", { name: "Recusar" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByText(nomeProjeto)).toHaveCount(0);

  await page.goto(`/projetos/${projetoId}`);
  await expect(
    page.getByText("Você recusou o convite para este projeto."),
  ).toBeVisible();
});

test("aluno aceito sai do projeto e o status muda para 'Você saiu' na lista", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor, aluno } = lerUsuariosDeTeste();
  const nomeProjeto = `Projeto Sair E2E ${Date.now()}`;
  const projetoId = await criarProjetoDeTeste(professor.id, nomeProjeto, {
    alunoAceitoId: aluno.id,
  });

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projetoId}`);
  await expect(
    page.getByRole("button", { name: "Sair do projeto" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair do projeto" }).click();
  await page.waitForURL("**/projetos");

  const card = page.locator("li", { hasText: nomeProjeto });
  await expect(card).toContainText("Você saiu");

  // Sem status 'aceito' mais, o conteúdo do projeto some.
  await page.goto(`/projetos/${projetoId}`);
  await expect(page.getByText("Você saiu deste projeto.")).toBeVisible();
});

test("professor remove aluno aceito e ele perde acesso ao conteúdo do projeto", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { professor, aluno } = lerUsuariosDeTeste();
  const projetoId = await criarProjetoDeTeste(
    professor.id,
    `Projeto Remover Aluno E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );

  await loginViaUI(page, professor);
  await page.goto(`/projetos/${projetoId}/alunos`);
  await expect(
    page.locator("li", { hasText: aluno.nome }),
  ).toContainText("Aceito");
  await page
    .getByRole("listitem")
    .filter({ hasText: aluno.nome })
    .getByRole("button", { name: "Remover" })
    .click();
  await expect(page.locator("li", { hasText: aluno.nome })).toContainText(
    "Removido",
  );
  // Removido não tem mais o botão de remover (não é mais 'aceito').
  await expect(
    page
      .locator("li", { hasText: aluno.nome })
      .getByRole("button", { name: "Remover" }),
  ).toHaveCount(0);

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projetoId}`);
  await expect(
    page.getByText("Você foi removido deste projeto pelo professor."),
  ).toBeVisible();
});
