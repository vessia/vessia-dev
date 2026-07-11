import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Memoizado por request via React cache() — chamar em várias páginas/
// componentes na mesma árvore de render não repete a ida ao Supabase.
export const verifySession = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

// Exige sessão + papel = 'professor'. Usado tanto em páginas (bloquear
// acesso à interface) quanto dentro dos próprios Server Actions — a
// interface esconder o botão não é suficiente sozinho.
export async function requireProfessor() {
  const user = await verifySession();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (profile?.papel !== "professor") {
    redirect(
      `/projetos?error=${encodeURIComponent("Apenas professores podem fazer isso.")}`,
    );
  }

  return user;
}

// Exige sessão + papel = 'aluno'. Mesmo padrão de requireProfessor() — usado
// em páginas e dentro dos Server Actions de participação/entrega.
export async function requireAluno() {
  const user = await verifySession();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (profile?.papel !== "aluno") {
    redirect(
      `/dashboard?error=${encodeURIComponent("Apenas alunos podem fazer isso.")}`,
    );
  }

  return user;
}

// Não redireciona — para uso em lugares que precisam saber "há alguém
// logado?" sem forçar login (ex: header mostrando nav diferente por papel).
export const getOptionalUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("nome, papel")
    .eq("id", userId)
    .single();

  return data;
});
