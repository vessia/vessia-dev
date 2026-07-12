import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";
import { loginViaUI } from "./helpers";

const SENHA = "senha-teste-vessia-123";

async function criarUsuarioMvpDeTeste(
  papel: "professor" | "aluno",
  nome: string,
) {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e.mvp.${papel}.${sufixo}@vessia.test`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Falha ao criar ${papel} de teste: ${error?.message}`);
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: data.user.id,
    nome,
    papel,
  });

  if (profileError) {
    throw new Error(
      `Falha ao criar profile de teste (${papel}): ${profileError.message}`,
    );
  }

  return { id: data.user.id, email, password: SENHA, nome, papel };
}

async function buscarIdPorNome(
  tabela: "projetos" | "etapas" | "missoes",
  coluna: string,
  valor: string,
  nomeColuna: string,
  nome: string,
) {
  const { data, error } = await supabaseAdmin
    .from(tabela)
    .select("id")
    .eq(coluna, valor)
    .eq(nomeColuna, nome)
    .single();

  if (error || !data) {
    throw new Error(
      `Não achei ${tabela} com ${nomeColuna}="${nome}": ${error?.message}`,
    );
  }

  return data.id as string;
}

type MissaoDoc = {
  titulo: string;
  tipo: string;
  objetivo: string;
  entrega: string;
  criterio: string;
  vagas: string;
  dependeDe: string | null;
};

// Réplica literal de docs/03 - Projeto Bíblia 3D.md, seção 4 (Etapa
// Descoberta). Etapa 0 (onboarding) NÃO entra aqui como missão — no Bloco
// 10 decidimos que onboarding é global e não pertence a nenhum projeto
// (ver DECISIONS.md), então a Missão 1 não tem nenhuma dependência de
// missão — o bloqueio dela já foi resolvido pelo gate de onboarding, antes
// mesmo do aluno chegar em /projetos.
const MISSOES_DESCOBERTA: MissaoDoc[] = [
  {
    titulo: "Estudar modelo de entrevista",
    tipo: "estudar",
    objetivo:
      "Conhecer o roteiro-base de entrevista antes de adaptá-lo ao Bíblia 3D.",
    entrega:
      "Nenhuma entrega formal — leitura do Roteiro Oficial de Entrevista - Empresa Júnior.md + checklist de auto-verificação.",
    criterio: 'Marcação de "concluído" pelo próprio aluno.',
    vagas: "2",
    dependeDe: null,
  },
  {
    titulo: "Montar roteiro de entrevista do Bíblia 3D",
    tipo: "escrever",
    objetivo:
      "Adaptar o roteiro oficial ao contexto específico do Bíblia 3D — um curso de programação para crianças.",
    entrega:
      "Roteiro adaptado (perguntas sobre o problema que o curso resolve, faixa etária das crianças, formato de ensino desejado, e confirmação explícita de que o escopo é só programação, sem conteúdo religioso).",
    criterio:
      "O roteiro cobre objetivo do curso, faixa etária, formato (presencial/remoto, duração), e inclui a pergunta de confirmação de escopo não-religioso.",
    vagas: "2",
    dependeDe: "Estudar modelo de entrevista",
  },
  {
    titulo: "Entrevistar responsável pelo Bíblia 3D",
    tipo: "entrevistar",
    objetivo:
      "Entender, com quem conhece o projeto na Fuctura, o que o curso precisa ser.",
    entrega: "Anotações ou gravação da entrevista.",
    criterio:
      "Todas as perguntas do roteiro foram respondidas; ficou claro o que o curso deve ensinar e para qual faixa etária.",
    vagas: "2",
    dependeDe: "Montar roteiro de entrevista do Bíblia 3D",
  },
  {
    titulo: "Organizar documentos e anotações",
    tipo: "escrever",
    objetivo:
      "Transformar a conversa em informação organizada, utilizável pelo resto do projeto.",
    entrega:
      "Documento organizado com os principais pontos levantados na entrevista.",
    criterio:
      "Alguém que não participou da entrevista consegue entender, só lendo o documento, o que é o Bíblia 3D.",
    vagas: "1",
    dependeDe: "Entrevistar responsável pelo Bíblia 3D",
  },
  {
    titulo: "Levantar dúvidas em aberto",
    tipo: "revisar",
    objetivo: "Identificar o que ainda não ficou claro antes de começar o PRD.",
    entrega:
      "Lista de perguntas pendentes (pode virar uma segunda conversa com o responsável).",
    criterio:
      "As dúvidas são relevantes para decidir o escopo do curso — não triviais.",
    vagas: "2",
    dependeDe: "Organizar documentos e anotações",
  },
];

test("MVP completo: professor monta o Bíblia 3D real, aluno percorre a Missão 1 do início ao desbloqueio da Missão 2", async ({
  page,
}) => {
  test.setTimeout(5 * 60 * 1000);

  const professor = await criarUsuarioMvpDeTeste("professor", "Professor Bíblia 3D E2E");
  const aluno = await criarUsuarioMvpDeTeste("aluno", "Aluno Bíblia 3D E2E");

  let projetoId = "";

  try {
    // ---- Passo 2: professor monta o projeto real, via UI -------------
    await loginViaUI(page, professor);

    await page.goto("/projetos/novo");
    await page.getByLabel("Nome").fill("Bíblia 3D");
    await page
      .getByLabel("Objetivo do projeto")
      .fill("Curso para crianças aprenderem programação. Sem conteúdo religioso.");
    await page.getByLabel("Cliente").fill("Fuctura Tecnologia");
    await page.getByRole("button", { name: "Salvar" }).click();
    await page.waitForURL("**/projetos");

    projetoId = await buscarIdPorNome(
      "projetos",
      "criado_por",
      professor.id,
      "nome",
      "Bíblia 3D",
    );

    await page.goto(`/projetos/${projetoId}/etapas/nova`);
    await page.getByLabel("Nome").fill("Descoberta");
    await page.getByLabel("Ordem").fill("1");
    await page.getByRole("button", { name: "Salvar" }).click();
    await page.waitForURL(`**/projetos/${projetoId}`);

    const etapaId = await buscarIdPorNome(
      "etapas",
      "projeto_id",
      projetoId,
      "nome",
      "Descoberta",
    );

    const idsPorTitulo = new Map<string, string>();

    for (const missao of MISSOES_DESCOBERTA) {
      await page.goto(`/projetos/${projetoId}/etapas/${etapaId}/missoes/nova`);
      await page.getByLabel("Título").fill(missao.titulo);
      await page.getByLabel("Tipo").selectOption(missao.tipo);
      await page.getByLabel("Objetivo").fill(missao.objetivo);
      await page.getByLabel("Entrega esperada").fill(missao.entrega);
      await page.getByLabel("Critério de avaliação").fill(missao.criterio);
      await page.getByLabel("Vagas").fill(missao.vagas);

      if (missao.dependeDe) {
        const idDependencia = idsPorTitulo.get(missao.dependeDe)!;
        await page.getByTestId(`dependencia-${idDependencia}`).check();
      }

      await page.getByRole("button", { name: "Salvar" }).click();
      await page.waitForURL(`**/projetos/${projetoId}/etapas/${etapaId}`);

      const id = await buscarIdPorNome(
        "missoes",
        "etapa_id",
        etapaId,
        "titulo",
        missao.titulo,
      );
      idsPorTitulo.set(missao.titulo, id);
    }

    const missao1Id = idsPorTitulo.get("Estudar modelo de entrevista")!;
    const missao2Id = idsPorTitulo.get(
      "Montar roteiro de entrevista do Bíblia 3D",
    )!;

    // ---- Passo 2b: professor atribui o aluno ao projeto (Bloco 12) ----
    // Desde a migration 006, participar de um projeto exige uma linha
    // 'aceita' em projeto_alunos — o professor precisa atribuir o aluno
    // antes dele conseguir ver qualquer etapa/missão (05 - Fluxos.md §2.1).
    await page.goto(`/projetos/${projetoId}/alunos`);
    await page.getByLabel("Buscar aluno por nome").fill(aluno.nome);
    await page.getByRole("button", { name: "Buscar" }).click();
    await page.getByRole("listitem").filter({ hasText: aluno.nome }).getByRole("button", { name: "Atribuir" }).click();
    await expect(page.getByText("Convidado (aguardando resposta)")).toBeVisible();

    // ---- Passo 3-4: aluno novo, onboarding, mapa do projeto -----------
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(aluno.email);
    await page.getByLabel("Senha").fill(aluno.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    // Confirma explicitamente: aluno é levado pro onboarding antes de
    // qualquer projeto, sem precisar de nenhuma explicação externa.
    await page.waitForURL("**/onboarding");
    await expect(
      page.getByRole("heading", { name: "Bem-vindo à Empresa Júnior" }),
    ).toBeVisible();

    for (let i = 0; i < 3; i++) {
      await page
        .getByRole("button", { name: "Marcar como concluído" })
        .click();
      await page.waitForURL("**/onboarding");
    }
    await expect(
      page.getByRole("button", { name: "Marcar como concluído" }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Continuar" }).click();
    await page.waitForURL("**/projetos");

    // Convite pendente: o projeto aparece na lista, mas o conteúdo só fica
    // acessível depois de aceitar (Bloco 12) — resposta é dada pelo
    // dashboard, não pela própria página do projeto.
    await page.goto("/dashboard");
    await expect(page.getByText("Bíblia 3D", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Aceitar" }).click();
    await page.waitForURL("**/dashboard");

    await page.goto("/projetos");
    await page.getByRole("link", { name: "Bíblia 3D" }).click();
    await page.waitForURL(`**/projetos/${projetoId}`);

    // Só a Missão 1 é um link (disponível); as outras 4 aparecem como
    // texto simples (bloqueadas), sem nenhuma explicação de terceiros.
    await expect(
      page.getByRole("link", { name: /Estudar modelo de entrevista/ }),
    ).toBeVisible();
    for (const missao of MISSOES_DESCOBERTA.slice(1)) {
      await expect(
        page.getByRole("link", { name: new RegExp(missao.titulo) }),
      ).toHaveCount(0);
      await expect(page.getByText(missao.titulo)).toBeVisible();
    }

    // ---- Passo 5: aluno participa da Missão 1 e entrega ---------------
    await page.getByRole("link", { name: /Estudar modelo de entrevista/ }).click();
    await page.waitForURL(`**/missoes/${missao1Id}`);

    await expect(
      page.getByText(
        "Conhecer o roteiro-base de entrevista antes de adaptá-lo ao Bíblia 3D.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText('Marcação de "concluído" pelo próprio aluno.'),
    ).toBeVisible();

    await page.getByRole("button", { name: "Participar" }).click();
    await page.waitForURL(`**/missoes/${missao1Id}`);

    await page
      .getByPlaceholder("Descreva o que você produziu, ou cole o link aqui...")
      .fill(
        "Li o Roteiro Oficial de Entrevista - Empresa Júnior.md na íntegra e completei o checklist de auto-verificação.",
      );
    await page.getByRole("button", { name: "Enviar" }).click();
    await page.waitForURL(`**/missoes/${missao1Id}`);
    await expect(
      page.getByText("Entrega enviada — aguardando avaliação do professor."),
    ).toBeVisible();

    // ---- Passo 6: professor avalia a entrega ---------------------------
    await loginViaUI(page, professor);
    await page.goto("/dashboard");

    await expect(
      page.getByText(new RegExp(`${aluno.nome}.*Estudar modelo de entrevista`)),
    ).toBeVisible();
    await page
      .getByRole("link", { name: new RegExp(`${aluno.nome}.*Estudar modelo`) })
      .click();
    await page.waitForURL(/\/avaliacoes\//);

    await expect(
      page.getByText('Marcação de "concluído" pelo próprio aluno.'),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Li o Roteiro Oficial de Entrevista - Empresa Júnior.md na íntegra",
      ),
    ).toBeVisible();

    await page.getByRole("button", { name: "Aprovar", exact: true }).click();
    await page.waitForURL("**/dashboard");

    // Aprovar a entrega NÃO conclui a missão sozinho — conclusão de missão
    // é sempre uma ação manual e separada do professor (DECISIONS.md:
    // "Conclusão de missão com múltiplas vagas é manual"). Sem este passo,
    // a Missão 1 fica "em_andamento" pra sempre e a Missão 2 nunca
    // desbloqueia — mesmo com a única entrega já aprovada.
    await page.goto(
      `/projetos/${projetoId}/etapas/${etapaId}/missoes/${missao1Id}`,
    );
    await page
      .getByRole("button", { name: "Marcar missão como concluída" })
      .click();
    await expect(page.getByText(/Concluída em/)).toBeVisible();

    // ---- Passo 7: aluno vê Missão 1 concluída e Missão 2 desbloqueada --
    await loginViaUI(page, aluno);

    await page.goto(
      `/projetos/${projetoId}/etapas/${etapaId}/missoes/${missao1Id}`,
    );
    await expect(page.getByTestId("missao-status-badge")).toContainText(
      "Concluída",
    );

    await page.goto(`/projetos/${projetoId}`);
    await expect(
      page.getByRole("link", {
        name: /Montar roteiro de entrevista do Bíblia 3D/,
      }),
    ).toBeVisible();

    await page.goto(
      `/projetos/${projetoId}/etapas/${etapaId}/missoes/${missao2Id}`,
    );
    await expect(page.getByTestId("missao-status-badge")).toContainText(
      "Disponível",
    );
  } finally {
    // ---- Passo 8: cleanup completo — nada deve sobrar no banco ---------
    if (projetoId) {
      await supabaseAdmin.from("projetos").delete().eq("id", projetoId);
    }
    await supabaseAdmin.auth.admin.deleteUser(professor.id);
    await supabaseAdmin.auth.admin.deleteUser(aluno.id);
  }
});
