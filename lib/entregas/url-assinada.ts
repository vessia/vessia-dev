import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const EXPIRACAO_SEGUNDOS = 60;

// Leitura do bucket 'entregas-arquivos' não tem policy de select pra
// usuário comum (docs/009_storage_entregas_imagens.sql) — só o servidor,
// com service role, gera a URL, e só depois que o chamador já confirmou
// acesso via usuarioPodeAcessarEntrega (lib/entregas/dal.ts).
export async function gerarUrlAssinadaArquivo(
  path: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("entregas-arquivos")
    .createSignedUrl(path, EXPIRACAO_SEGUNDOS);

  if (error || !data) return null;

  return data.signedUrl;
}
