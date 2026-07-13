"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validarNovaSenha } from "@/lib/auth/validacao-senha";

export async function redefinirSenha(formData: FormData) {
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmar_senha") ?? "");

  const resultado = validarNovaSenha({ senha, confirmarSenha });
  if (!resultado.permitido) {
    redirect(`/redefinir-senha?error=${encodeURIComponent(resultado.motivo)}`);
  }

  const supabase = await createClient();

  // A sessão de recovery vem do próprio link do e-mail, trocada em
  // /auth/callback antes de chegar aqui. Se não houver mais sessão válida
  // (link já usado, expirado, ou aberto direto sem passar pelo link), não
  // adianta tentar de novo nesta mesma página — manda pedir um link novo.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/recuperar-senha?error=${encodeURIComponent(
        "Link expirado ou inválido. Solicite um novo link.",
      )}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) {
    redirect(`/redefinir-senha?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Senha redefinida com sucesso. Entre com sua nova senha.",
    )}`,
  );
}
