"use server";

import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";
import { validarFeedback } from "@/lib/feedbacks/validacao";

export type ResultadoEnvioFeedback =
  | { status: "idle" }
  | { status: "sucesso" }
  | { status: "erro"; mensagem: string };

// Sem redirect() de propósito — a confirmação é inline no próprio modal
// ("Obrigado!"), não uma navegação de página (ver instrução do widget).
// A checagem de sessão (verifySession) continua valendo como segunda
// camada: se por algum motivo isso for chamado sem sessão, redireciona pro
// login — mesmo padrão do resto do app — mas isso nunca acontece no fluxo
// normal, já que o botão só aparece pra quem já está autenticado.
export async function enviarFeedback(
  _estadoAnterior: ResultadoEnvioFeedback,
  formData: FormData,
): Promise<ResultadoEnvioFeedback> {
  const user = await verifySession();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { status: "erro", mensagem: "Perfil não encontrado." };
  }

  const avaliacao = Number(formData.get("avaliacao"));
  const categoria = String(formData.get("categoria") ?? "");
  const comentario = String(formData.get("comentario") ?? "").trim() || null;
  const paginaOrigem = String(formData.get("pagina_origem") ?? "");

  const validacao = validarFeedback({ avaliacao, categoria });
  if (!validacao.permitido) {
    return { status: "erro", mensagem: validacao.motivo };
  }

  const { error } = await supabase.from("feedbacks").insert({
    usuario_id: user.id,
    papel_no_momento: profile.papel,
    avaliacao,
    categoria,
    comentario,
    pagina_origem: paginaOrigem,
  });

  if (error) {
    return {
      status: "erro",
      mensagem: "Não foi possível enviar o feedback. Tente novamente.",
    };
  }

  return { status: "sucesso" };
}
