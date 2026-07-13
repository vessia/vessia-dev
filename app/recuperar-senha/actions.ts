"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function solicitarRecuperacaoSenha(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(`/recuperar-senha?error=${encodeURIComponent("Informe um e-mail.")}`);
  }

  const headersList = await headers();
  const origin = headersList.get("origin") ?? `https://${headersList.get("host")}`;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/redefinir-senha")}`,
  });

  // DECISIONS.md, "Recuperação de senha implementada": mesma mensagem
  // independente de o e-mail existir ou não — não revela se um e-mail está
  // cadastrado (mesmo raciocínio já aplicado no fluxo de cadastro).
  redirect(
    `/recuperar-senha?message=${encodeURIComponent(
      "Se esse e-mail estiver cadastrado, você vai receber um link para redefinir sua senha em instantes.",
    )}`,
  );
}
