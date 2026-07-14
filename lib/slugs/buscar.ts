import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Server Actions guardam o id real (uuid) nos campos ocultos dos forms, mas
// precisam do slug pra montar a URL de redirect (rotas agora são
// slug-based). Fallback pro próprio id é só defesa — nunca deveria
// acontecer, já que slug é NOT NULL.
export async function buscarSlugPorId(
  supabase: SupabaseClient,
  tabela: "projetos" | "etapas" | "missoes",
  id: string,
): Promise<string> {
  const { data } = await supabase
    .from(tabela)
    .select("slug")
    .eq("id", id)
    .single();

  return data?.slug ?? id;
}
