import { expect, test } from "@playwright/test";
import {
  criarEtapaDeTeste,
  criarMissaoDeTeste,
  criarParticipacaoDeTeste,
  criarProjetoDeTeste,
  lerUsuariosDeTeste,
  loginViaUI,
} from "./helpers";
import { supabaseAdmin } from "./supabase-admin";

// PNG 1x1 válido (transparente) — usado real, não só um buffer qualquer,
// pra exercitar a renderização de <img> de verdade na tela de avaliação.
const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

async function buscarEntregaIdMaisRecente(participacaoId: string) {
  const { data } = await supabaseAdmin
    .from("entregas")
    .select("id")
    .eq("participacao_id", participacaoId)
    .order("numero_tentativa", { ascending: false })
    .limit(1)
    .single();
  return data!.id as string;
}

test("aluno envia uma imagem como entrega e o professor consegue vê-la na avaliação", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Upload Imagem E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Upload Imagem");
  const participacaoId = await criarParticipacaoDeTeste(missao.id, aluno.id);

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`);

  await page.getByRole("radio", { name: "Imagem ou PDF" }).check();
  await page.locator('input[type="file"]').setInputFiles({
    name: "captura.png",
    mimeType: "image/png",
    buffer: Buffer.from(PNG_1X1_BASE64, "base64"),
  });
  await page.getByRole("button", { name: "Enviar" }).click();

  await expect(
    page.getByText("Entrega enviada — aguardando avaliação do professor."),
  ).toBeVisible();

  const entregaId = await buscarEntregaIdMaisRecente(participacaoId);
  const { data: entrega } = await supabaseAdmin
    .from("entregas")
    .select("tipo_conteudo, conteudo")
    .eq("id", entregaId)
    .single();
  expect(entrega?.tipo_conteudo).toBe("arquivo");
  expect(entrega?.conteudo).toContain(`${aluno.id}/${participacaoId}/1/`);
  expect(entrega?.conteudo).toContain("captura.png");

  await loginViaUI(page, professor);
  await page.goto(`/avaliacoes/${entregaId}`);

  const imagem = page.getByAltText("Imagem enviada como entrega");
  await expect(imagem).toBeVisible();
  const src = await imagem.getAttribute("src");
  expect(src).toBeTruthy();
  expect(src).toContain("entregas-arquivos");
});

test("aluno envia um PDF como entrega e o professor vê o link para abrir", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Upload PDF E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Upload PDF");
  const participacaoId = await criarParticipacaoDeTeste(missao.id, aluno.id);

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`);

  await page.getByRole("radio", { name: "Imagem ou PDF" }).check();
  await page.locator('input[type="file"]').setInputFiles({
    name: "prd.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.1 conteúdo de teste"),
  });
  await page.getByRole("button", { name: "Enviar" }).click();

  await expect(
    page.getByText("Entrega enviada — aguardando avaliação do professor."),
  ).toBeVisible();

  const entregaId = await buscarEntregaIdMaisRecente(participacaoId);

  await loginViaUI(page, professor);
  await page.goto(`/avaliacoes/${entregaId}`);

  const link = page.getByRole("link", { name: "📄 Abrir PDF" });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();
  expect(href).toContain("entregas-arquivos");
  await expect(link).toHaveAttribute("target", "_blank");
});

test("upload de tipo de arquivo não suportado é bloqueado com mensagem amigável", async ({
  page,
}) => {
  const { professor, aluno } = lerUsuariosDeTeste();
  const projeto = await criarProjetoDeTeste(
    professor.id,
    `Projeto Upload Invalido E2E ${Date.now()}`,
    { alunoAceitoId: aluno.id },
  );
  const etapa = await criarEtapaDeTeste(projeto.id, "Descoberta", 1);
  const missao = await criarMissaoDeTeste(etapa.id, "Missão Upload Invalido");
  const participacaoId = await criarParticipacaoDeTeste(missao.id, aluno.id);

  await loginViaUI(page, aluno);
  await page.goto(`/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`);

  await page.getByRole("radio", { name: "Imagem ou PDF" }).check();
  await page.locator('input[type="file"]').setInputFiles({
    name: "video.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("conteudo qualquer"),
  });
  await page.getByRole("button", { name: "Enviar" }).click();

  await expect(page.getByTestId("banner-error")).toContainText(
    "Tipo de arquivo não suportado",
  );

  const { count } = await supabaseAdmin
    .from("entregas")
    .select("*", { count: "exact", head: true })
    .eq("participacao_id", participacaoId);
  expect(count).toBe(0);
});
