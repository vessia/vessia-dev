"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function cadastrar(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const papel = String(formData.get("papel") ?? "");

  if (!nome || !email || !senha || (papel !== "professor" && papel !== "aluno")) {
    redirect(`/cadastro?error=${encodeURIComponent("Preencha todos os campos.")}`);
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
    papel,
  });

  if (profileError) {
    redirect(
      `/cadastro?error=${encodeURIComponent(
        "Conta criada, mas houve um erro ao salvar o perfil: " + profileError.message,
      )}`,
    );
  }

  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent(
        "Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar.",
      )}`,
    );
  }

  redirect("/dashboard");
}
