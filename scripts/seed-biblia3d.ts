// Script avulso, roda uma vez via service role — não faz parte do app.
// Uso: npx tsx scripts/seed-biblia3d.ts
//
// Cria o essencial do Projeto Bíblia 3D pra validar antes do restante:
// projeto + vínculo do professor proprietário + Etapa 1 + Missão 1.

import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const EMAIL_PROFESSOR = "caiomvital@gmail.com";

const TERMO_ESPECIFICO = `Ao participar do projeto Bíblia 3D dentro da Empresa Júnior da Fuctura Tecnologia, o aluno declara estar ciente e de acordo com o seguinte:

Natureza pedagógica. Este projeto tem finalidade exclusivamente educacional, como parte das atividades práticas da Empresa Júnior. Não se trata de estágio, emprego, prestação de serviço remunerada, nem qualquer outra modalidade de vínculo profissional.

Ausência de vínculo trabalhista. A participação neste projeto não gera, sob nenhuma hipótese, vínculo empregatício, relação de trabalho, ou qualquer obrigação de natureza trabalhista entre o aluno e a Fuctura Tecnologia, o cliente do projeto, ou qualquer terceiro envolvido.

Ausência de remuneração. O aluno reconhece que não há remuneração, bolsa, ou qualquer contrapartida financeira pela participação neste projeto, e que não poderá requerer pagamento, indenização ou compensação de qualquer natureza pelo trabalho realizado.

Caráter voluntário e formativo. A participação é voluntária e tem como objetivo o aprendizado prático do aluno através da execução de um projeto real, sob orientação de professores responsáveis.

Uso do material produzido. O material produzido pelo aluno durante o projeto (código, documentos, entregas) pode ser utilizado pela Fuctura Tecnologia e pela Empresa Júnior para fins pedagógicos, de avaliação, e de divulgação institucional das atividades da Empresa Júnior.

Ao aceitar este termo, o aluno confirma que leu e compreendeu as condições acima antes de iniciar sua participação nas missões deste projeto.`;

async function buscarIdProfessor(): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw new Error(`Falha ao listar usuários: ${error.message}`);

  const usuario = data.users.find((u) => u.email === EMAIL_PROFESSOR);
  if (!usuario) {
    throw new Error(`Nenhum usuário encontrado com e-mail ${EMAIL_PROFESSOR}`);
  }

  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from("profiles")
    .select("id, papel")
    .eq("id", usuario.id)
    .single();

  if (perfilError || !perfil) {
    throw new Error(`Falha ao buscar profile de ${EMAIL_PROFESSOR}: ${perfilError?.message}`);
  }
  if (perfil.papel !== "professor") {
    throw new Error(`${EMAIL_PROFESSOR} não tem papel 'professor' (tem '${perfil.papel}')`);
  }

  return perfil.id as string;
}

async function main() {
  const professorId = await buscarIdProfessor();

  const { data: existente } = await supabaseAdmin
    .from("projetos")
    .select("id")
    .eq("nome", "Bíblia 3D")
    .maybeSingle();

  if (existente) {
    throw new Error(
      `Já existe um projeto "Bíblia 3D" (id ${existente.id}) — script não roda de novo em cima de um seed existente.`,
    );
  }

  const { data: projeto, error: projetoError } = await supabaseAdmin
    .from("projetos")
    .insert({
      nome: "Bíblia 3D",
      descricao:
        "Painel do aluno para o curso Bíblia 3D (Fuctura) — modalidade infantil de programação. O produto é o painel, não o curso em si. Escopo restrito a funcionalidades de programação, sem conteúdo religioso.",
      cliente: "Fuctura Tecnologia",
      criado_por: professorId,
      termo_especifico: TERMO_ESPECIFICO,
    })
    .select("id")
    .single();

  if (projetoError || !projeto) {
    throw new Error(`Falha ao criar projeto: ${projetoError?.message}`);
  }

  const { error: vinculoError } = await supabaseAdmin.from("projeto_professores").insert({
    projeto_id: projeto.id,
    professor_id: professorId,
    papel_no_projeto: "proprietario",
    adicionado_por: professorId,
  });

  if (vinculoError) {
    throw new Error(`Falha ao vincular professor proprietário: ${vinculoError.message}`);
  }

  const { data: etapa, error: etapaError } = await supabaseAdmin
    .from("etapas")
    .insert({ projeto_id: projeto.id, nome: "Descoberta", ordem: 1 })
    .select("id")
    .single();

  if (etapaError || !etapa) {
    throw new Error(`Falha ao criar etapa: ${etapaError?.message}`);
  }

  const { data: missao, error: missaoError } = await supabaseAdmin
    .from("missoes")
    .insert({
      etapa_id: etapa.id,
      titulo: "Estudar modelo de entrevista",
      tipo: "estudar",
      objetivo: "Conhecer o roteiro-base de entrevista antes de adaptá-lo ao Bíblia 3D.",
      entrega_esperada:
        "Nenhuma entrega formal — leitura do roteiro oficial de entrevista da Empresa Júnior + checklist de auto-verificação.",
      criterio_avaliacao: "Marcação de 'concluído' pelo próprio aluno.",
      obrigatoria: true,
      vagas: 2,
    })
    .select("id")
    .single();

  if (missaoError || !missao) {
    throw new Error(`Falha ao criar missão: ${missaoError?.message}`);
  }

  const { data: missaoComStatus, error: statusError } = await supabaseAdmin
    .from("missoes_com_status")
    .select("status_calculado")
    .eq("id", missao.id)
    .single();

  if (statusError || !missaoComStatus) {
    throw new Error(`Falha ao ler status calculado da missão: ${statusError?.message}`);
  }

  console.log("Seed concluído:");
  console.log(`  Projeto "Bíblia 3D": ${projeto.id}`);
  console.log(`  Professor proprietário: ${professorId} (${EMAIL_PROFESSOR})`);
  console.log(`  Etapa "Descoberta" (ordem 1): ${etapa.id}`);
  console.log(`  Missão "Estudar modelo de entrevista": ${missao.id}`);
  console.log(`  Status calculado da missão (visão do aluno): ${missaoComStatus.status_calculado}`);
}

main().catch((err) => {
  console.error("Seed falhou:", err.message);
  process.exit(1);
});
