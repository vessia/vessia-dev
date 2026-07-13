import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Necessária para o padrão @supabase/ssr no App Router: o link de
// confirmação de e-mail (ou magic link) aponta para cá com um `code` que
// precisa ser trocado por uma sessão antes de redirecionar o usuário.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Recuperação de senha (DECISIONS.md, "Recuperação de senha implementada")
  // usa este mesmo callback — se o código falhar (link expirado ou já
  // usado), a mensagem certa depende de qual fluxo trouxe o usuário até
  // aqui, não é sempre sobre confirmação de e-mail.
  if (next === "/redefinir-senha") {
    return NextResponse.redirect(
      `${origin}/recuperar-senha?error=${encodeURIComponent(
        "Link expirado ou inválido. Solicite um novo link.",
      )}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "Não foi possível confirmar o e-mail. Tente entrar novamente ou solicite um novo link.",
    )}`,
  );
}
