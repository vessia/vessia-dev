import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardingCompleto } from "@/lib/onboarding/dal";
import { precisaAceitarTermoEspecifico } from "@/lib/participacoes/validacoes";
import { SubmitButton } from "@/app/_components/submit-button";
import { aceitarTermoProjeto } from "./actions";

// DECISIONS.md, "Aceite do termo específico vira gate de projeto, não
// embutido numa missão": tela isolada, só texto do termo + "Li e concordo"
// — sem nenhum outro elemento (nada de formulário de entrega, nada de
// navegação pra missão). Um aluno confundiu o aceite com o envio de
// entrega quando os dois apareciam juntos na página da missão.
export default async function AceitarTermoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireOnboardingCompleto();
  const { slug } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  const { data: projeto } = await supabase
    .from("projetos")
    .select("id, slug, nome, termo_especifico")
    .eq("slug", slug)
    .single();

  if (!projeto) {
    notFound();
  }

  // Só faz sentido pra aluno com vínculo aceito e termo pendente — qualquer
  // outra combinação (professor, convite ainda não aceito, termo já
  // aceito, projeto sem termo) volta pro projeto direto.
  if (profile?.papel !== "aluno") {
    redirect(`/projetos/${projeto.slug}`);
  }

  const { data: vinculo } = await supabase
    .from("projeto_alunos")
    .select("status, termo_aceito_em")
    .eq("projeto_id", projeto.id)
    .eq("aluno_id", user.id)
    .maybeSingle();

  if (vinculo?.status !== "aceito") {
    redirect(`/projetos/${projeto.slug}`);
  }

  const pendente = precisaAceitarTermoEspecifico({
    termoEspecifico: projeto.termo_especifico,
    termoAceitoEm: vinculo.termo_aceito_em,
  });

  if (!pendente) {
    redirect(`/projetos/${projeto.slug}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 p-4 text-center sm:p-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Termo específico deste projeto
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {projeto.nome}
        </p>
      </div>

      <p className="w-full whitespace-pre-wrap rounded-xl border border-zinc-200 bg-white p-6 text-left text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        {projeto.termo_especifico}
      </p>

      <form action={aceitarTermoProjeto}>
        <input type="hidden" name="projeto_id" value={projeto.id} />
        <SubmitButton pendingText="Registrando...">
          Li e concordo
        </SubmitButton>
      </form>
    </main>
  );
}
