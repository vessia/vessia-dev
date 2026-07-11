import fs from "node:fs";
import path from "node:path";
import { supabaseAdmin } from "./supabase-admin";

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
    papel,
  });

  if (profileError) {
    throw new Error(
      `Falha ao criar profile de teste (${papel}): ${profileError.message}`,
    );
  }

  return { id: data.user.id, email, password: SENHA_TESTE, nome, papel };
}

// Se uma execução anterior crashou antes do global-teardown rodar (ex: falta
// de memória), essa varredura evita acumular contas de teste órfãs para
// sempre — qualquer usuário de teste remanescente (prefixo "e2e.") é apagado
// antes de criar o par novo desta execução.
async function limparUsuariosOrfaos() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 200,
  });
  if (error) return;

  const orfaos = data.users.filter((u) => u.email?.startsWith("e2e."));

  for (const usuario of orfaos) {
    await supabaseAdmin.from("projetos").delete().eq("criado_por", usuario.id);
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
