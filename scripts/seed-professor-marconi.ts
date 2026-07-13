// Script avulso, roda uma vez via service role — não faz parte do app.
// Uso: npx tsx scripts/seed-professor-marconi.ts
//
// Cria a conta de professor do Marconi e vincula como colaborador do
// projeto Bíblia 3D.

import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const EMAIL_MARCONI = "marconi.junior97@gmail.com";
// Lida de variável de ambiente (não fica em texto puro no arquivo — este
// repositório é público) — passe SENHA_INICIAL_MARCONI só na hora de rodar.
const SENHA_INICIAL = process.env.SENHA_INICIAL_MARCONI;
const NOME_MARCONI = "Marconi";
const EMAIL_CAIO = "caiomvital@gmail.com";
const NOME_PROJETO = "Bíblia 3D";

async function buscarIdProfessor(email: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw new Error(`Falha ao listar usuários: ${error.message}`);

  const usuario = data.users.find((u) => u.email === email);
  if (!usuario) throw new Error(`Nenhum usuário encontrado com e-mail ${email}`);

  return usuario.id;
}

async function main() {
  if (!SENHA_INICIAL) {
    throw new Error(
      "Defina SENHA_INICIAL_MARCONI no ambiente antes de rodar (não fica no código-fonte, o repositório é público).",
    );
  }

  const caioId = await buscarIdProfessor(EMAIL_CAIO);

  const { data: existente } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", EMAIL_MARCONI)
    .maybeSingle();

  if (existente) {
    throw new Error(
      `Já existe uma conta com e-mail ${EMAIL_MARCONI} (id ${existente.id}) — script não roda de novo em cima de um seed existente.`,
    );
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: EMAIL_MARCONI,
    password: SENHA_INICIAL,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    throw new Error(`Falha ao criar usuário no Auth: ${authError?.message}`);
  }

  const marconiId = authData.user.id;

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: marconiId,
    nome: NOME_MARCONI,
    email: EMAIL_MARCONI,
    papel: "professor",
  });

  if (profileError) {
    throw new Error(`Falha ao criar profile: ${profileError.message}`);
  }

  const { data: projeto, error: projetoError } = await supabaseAdmin
    .from("projetos")
    .select("id")
    .eq("nome", NOME_PROJETO)
    .single();

  if (projetoError || !projeto) {
    throw new Error(`Falha ao buscar projeto "${NOME_PROJETO}": ${projetoError?.message}`);
  }

  const { error: vinculoError } = await supabaseAdmin.from("projeto_professores").insert({
    projeto_id: projeto.id,
    professor_id: marconiId,
    papel_no_projeto: "colaborador",
    adicionado_por: caioId,
  });

  if (vinculoError) {
    throw new Error(`Falha ao vincular Marconi como colaborador: ${vinculoError.message}`);
  }

  console.log("Seed concluído:");
  console.log(`  Conta do Marconi: ${marconiId} (${EMAIL_MARCONI})`);
  console.log(`  Projeto "${NOME_PROJETO}": ${projeto.id}`);
  console.log(`  Vínculo: colaborador, adicionado por ${caioId} (${EMAIL_CAIO})`);
}

main().catch((err) => {
  console.error("Seed falhou:", err.message);
  process.exit(1);
});
