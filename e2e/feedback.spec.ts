import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { lerUsuariosDeTeste, loginViaUI } from "./helpers";
import { supabaseAdmin } from "./supabase-admin";

test("envio de feedback autenticado cria a linha corretamente", async ({
  page,
}) => {
  const { professor } = lerUsuariosDeTeste();

  await loginViaUI(page, professor);
  await page.goto("/dashboard");

  await page.getByRole("button", { name: "Dar feedback" }).click();
  // A entrada de avaliação é visualmente escondida (sr-only) — o label
  // circular é o alvo de clique de verdade, então o input intercepta
  // clique de forma diferente do esperado; force é apropriado aqui.
  await page
    .getByRole("radio", { name: "4", exact: true })
    .check({ force: true });
  await page.getByRole("radio", { name: "Tela confusa" }).check();
  await page
    .getByLabel("Quer detalhar? (opcional)")
    .fill("Comentário de teste E2E.");
  await page.getByRole("button", { name: "Enviar" }).click();

  await expect(page.getByText("Obrigado!")).toBeVisible();

  const { data, error } = await supabaseAdmin
    .from("feedbacks")
    .select(
      "usuario_id, papel_no_momento, avaliacao, categoria, comentario, pagina_origem",
    )
    .eq("usuario_id", professor.id)
    .order("criado_em", { ascending: false })
    .limit(1)
    .single();

  expect(error).toBeNull();
  expect(data?.usuario_id).toBe(professor.id);
  expect(data?.papel_no_momento).toBe("professor");
  expect(data?.avaliacao).toBe(4);
  expect(data?.categoria).toBe("tela_confusa");
  expect(data?.comentario).toBe("Comentário de teste E2E.");
  expect(data?.pagina_origem).toBe("/dashboard");
});

test("botão de feedback não aparece em /login, e inserção sem sessão é bloqueada pela RLS", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Dar feedback" }),
  ).toHaveCount(0);

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { aluno } = lerUsuariosDeTeste();

  const { error } = await anon.from("feedbacks").insert({
    usuario_id: aluno.id,
    papel_no_momento: "aluno",
    avaliacao: 5,
    categoria: "esta_bom",
    pagina_origem: "/dashboard",
  });

  expect(error).not.toBeNull();
  expect(error?.code).toBe("42501");

  const { count } = await supabaseAdmin
    .from("feedbacks")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", aluno.id)
    .eq("pagina_origem", "/dashboard")
    .eq("avaliacao", 5);
  expect(count).toBe(0);
});
