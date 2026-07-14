import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { gerarSlugBase } from "./gerar";

// Gera um slug único dentro do escopo dado (nenhum escopo = único
// globalmente, como projetos; um escopo = único dentro do pai, como
// etapa por projeto ou missão por etapa). Colisão vira sufixo numérico
// (DECISIONS.md: "descoberta", "descoberta-2", ...).
//
// Usa client admin (service role) para a checagem de colisão, não o client
// do usuário logado: o índice único é global na tabela, mas RLS restringe o
// que o usuário enxerga (ex: professor sem vínculo com outro projeto não vê
// a linha colidente) — checar com RLS deixava a colisão passar despercebida
// e a inserção quebrava com erro cru de constraint do Postgres.
export async function gerarSlugUnico(
  tabela: "projetos" | "etapas" | "missoes",
  filtroEscopo: Record<string, string> | null,
  textoBase: string,
): Promise<string> {
  const admin = createAdminClient();
  const base = gerarSlugBase(textoBase);
  let candidato = base;
  let sufixo = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = admin.from(tabela).select("id").eq("slug", candidato);
    if (filtroEscopo) {
      for (const [coluna, valor] of Object.entries(filtroEscopo)) {
        query = query.eq(coluna, valor);
      }
    }
    const { data } = await query.maybeSingle();
    if (!data) {
      return candidato;
    }
    sufixo += 1;
    candidato = `${base}-${sufixo}`;
  }
}
