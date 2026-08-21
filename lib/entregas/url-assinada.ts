import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// 60s original expirava antes do professor clicar de verdade — URL é
// gerada no SSR da página, e ler os critérios da missão ou outras
// entregas antes de abrir um PDF facilmente passa de 1 minuto, gerando
// "InvalidJWT: exp claim timestamp check failed" ao clicar. 5 minutos
// ainda é curta duração (objetivo original), só realista pro uso real.
const EXPIRACAO_SEGUNDOS = 300;

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
