import fs from "node:fs";
import path from "node:path";
import { supabaseAdmin } from "./supabase-admin";
import { ITENS_ONBOARDING } from "../lib/onboarding/constantes";

const STATE_PATH = path.resolve(__dirname, ".auth/state.json");
const SENHA_TESTE = "senha-teste-vessia-123";

async function criarUsuarioDeTeste(papel: "professor" | "aluno") {
  const sufixo = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e.${papel}.${sufixo}@vessia.test`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: SENHA_TESTE,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(
      `Falha ao criar usuário de teste (${papel}): ${error?.message}`,
    );
  }

  const nome = papel === "professor" ? "Professor E2E" : "Aluno E2E";

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: data.user.id,
    nome,
    email,
    papel,
  });

  if (profileError) {
    throw new Error(
      `Falha ao criar profile de teste (${papel}): ${profileError.message}`,
    );
  }

  // A conta de aluno compartilhada é usada por praticamente todo outro spec
  // pra testar /projetos, mapa, missões etc. — sem isso, o gate de
  // onboarding (Bloco 10) redirecionaria todos eles pra /onboarding.
  // Onboarding em si é testado à parte, com uma conta dedicada e "virgem"
  // (ver e2e/onboarding.spec.ts).
  if (papel === "aluno") {
    const { error: onboardingError } = await supabaseAdmin
      .from("onboarding_progresso")
      .insert(
        ITENS_ONBOARDING.map((item) => ({
          aluno_id: data.user.id,
          item: item.chave,
        })),
      );

    if (onboardingError) {
      throw new Error(
        `Falha ao pré-completar onboarding do aluno de teste: ${onboardingError.message}`,
      );
    }
  }

  return { id: data.user.id, email, password: SENHA_TESTE, nome, papel };
}

// Se uma execução anterior crashou antes do global-teardown rodar (ex: falta
// de memória), essa varredura evita acumular contas de teste órfãs para
// sempre — qualquer usuário de teste remanescente (prefixo "e2e.") é apagado
// antes de criar o par novo desta execução.
//
// Bloco 12: projeto_professores/projeto_alunos referenciam profiles por
// professor_id/aluno_id SEM on delete cascade (só projeto_id tem cascade).
// Se um órfão A for "dono" do projeto e um órfão B estiver vinculado nele
// (colaborador/aluno atribuído), apagar B antes do projeto de A cascatear
// esse vínculo derruba a exclusão de B com uma violação de FK. Por isso os
// dois passos são separados: primeiro apaga TODOS os projetos de TODOS os
// órfãos (cascateando todo vínculo entre eles), só depois apaga os usuários.
async function limparUsuariosOrfaos() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 200,
  });
  if (error) return;

  const orfaos = data.users.filter((u) => u.email?.startsWith("e2e."));

  for (const usuario of orfaos) {
    await supabaseAdmin.from("projetos").delete().eq("criado_por", usuario.id);
  }

  for (const usuario of orfaos) {
    await supabaseAdmin.auth.admin.deleteUser(usuario.id);
  }
}

export default async function globalSetup() {
  await limparUsuariosOrfaos();

  const professor = await criarUsuarioDeTeste("professor");
  const aluno = await criarUsuarioDeTeste("aluno");

  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify({ professor, aluno }, null, 2));
}
