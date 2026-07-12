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

  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent(
        "Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar.",
      )}`,
    );
  }

  redirect("/dashboard");
}
