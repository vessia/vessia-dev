"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAluno } from "@/lib/auth/dal";
import { buscarSlugPorId } from "@/lib/slugs/buscar";

// Aceite é por projeto, não por missão (DECISIONS.md) — grava direto em
// projeto_alunos. Depois de aceitar, segue pro mapa do projeto (não mais
// de volta pra uma missão específica, já que o gate agora acontece antes
// de qualquer conteúdo de missão ser visto).
export async function aceitarTermoProjeto(formData: FormData) {
  const user = await requireAluno();

  const projetoId = String(formData.get("projeto_id") ?? "");
  const supabase = await createClient();
  const projetoSlug = await buscarSlugPorId(supabase, "projetos", projetoId);
  const destino = `/projetos/${projetoSlug}`;

  const { error } = await supabase
    .from("projeto_alunos")
    .update({ termo_aceito_em: new Date().toISOString() })
    .eq("projeto_id", projetoId)
    .eq("aluno_id", user.id);

  if (error) {
    redirect(`${destino}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(destino);
}
