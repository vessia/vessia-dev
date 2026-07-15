"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function cadastrar(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const aceiteTermos = formData.get("aceite_termos") === "on";
  // Cadastro público só cria conta de Aluno (ver DECISIONS.md). Conta de
  // Professor é criada diretamente pelo Gestor, fora dessa tela.
  const papel = "aluno";

  if (!nome || !email || !senha) {
    redirect(`/cadastro?error=${encodeURIComponent("Preencha todos os campos.")}`);
  }

  // O `required` no checkbox é só UX — a Server Action revalida, mesmo
  // padrão de duas camadas usado no resto do app (DECISIONS.md: aceite dos
  // Termos é evidência de consentimento, não cosmético).
  if (!aceiteTermos) {
    redirect(
      `/cadastro?error=${encodeURIComponent(
        "É preciso concordar com os Termos de Uso e a Política de Privacidade para criar uma conta.",
      )}`,
    );
  }

  const headersList = await headers();
  const origin = headersList.get("origin") ?? `https://${headersList.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    const mensagem = /already registered|already exists/i.test(error.message)
      ? "Este e-mail já está cadastrado."
      : error.message;
    redirect(`/cadastro?error=${encodeURIComponent(mensagem)}`);
  }

  // Se a confirmação de e-mail está habilitada no projeto, o Supabase
  // retorna sucesso com `identities: []` para e-mail já cadastrado (em vez
  // de um erro), para não permitir enumeração de usuários.
  if (!data.user || data.user.identities?.length === 0) {
    redirect(`/cadastro?error=${encodeURIComponent("Este e-mail já está cadastrado.")}`);
  }

  const admin = createAdminClient();
  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user!.id,
    nome,
    email,
    papel,
    termos_aceitos_em: new Date().toISOString(),
  });

  if (profileError) {
    redirect(
      `/cadastro?error=${encodeURIComponent(
        "Conta criada, mas houve um erro ao salvar o perfil: " + profileError.message,
      )}`,
    );
  }

  await resolverConvitesPendentes(admin, email, data.user!.id);

  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent(
        "Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar (se não encontrar, olhe também a caixa de spam).",
      )}`,
    );
  }

  redirect("/dashboard");
}

// DECISIONS.md, "Convite por e-mail para aluno não cadastrado ainda": todo
// convite pendente (em qualquer projeto) para o e-mail recém-cadastrado
// vira vínculo em projeto_alunos, igual a uma atribuição normal — o aluno
// segue vendo e respondendo (aceitar/recusar) exatamente como já funciona.
async function resolverConvitesPendentes(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  alunoId: string,
) {
  const { data: convites } = await admin
    .from("convites_email_pendentes")
    .select("id, projeto_id, convidado_por")
    .ilike("email", email)
    .is("resolvido_em", null);

  for (const convite of convites ?? []) {
    await admin.from("projeto_alunos").insert({
      projeto_id: convite.projeto_id,
      aluno_id: alunoId,
      status: "convidado",
      atribuido_por: convite.convidado_por,
    });

    await admin
      .from("convites_email_pendentes")
      .update({ resolvido_em: new Date().toISOString() })
      .eq("id", convite.id);
  }
}
