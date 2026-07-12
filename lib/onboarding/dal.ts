import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifySession, getProfile } from "@/lib/auth/dal";
import { onboardingCompleto } from "./progresso";

// Exige sessão + (se aluno) onboarding completo — usado nas telas de
// projeto. Professor nunca é bloqueado (tarefa 29: "não é bloqueante pra
// ele"). Mesmo padrão de requireProfessor()/requireAluno(): página E ação
// nunca devem depender só da UI esconder o caminho.
export async function requireOnboardingCompleto() {
  const user = await verifySession();
  const profile = await getProfile(user.id);

  if (profile?.papel !== "aluno") {
    return user;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("onboarding_progresso")
    .select("item")
    .eq("aluno_id", user.id);

  const concluidos = (data ?? []).map((d) => d.item);

  if (!onboardingCompleto(concluidos)) {
    redirect("/onboarding");
  }

  return user;
}
