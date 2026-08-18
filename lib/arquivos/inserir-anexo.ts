import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type DonoArquivo = "projeto" | "missao" | "etapa" | "entrega" | "avaliacao";

// Arquivo como entidade própria (DECISIONS.md, "Anexo como entidade própria")
// — reaproveitado por Missão (anexo de apoio, só link) e Etapa (anexo de
// conclusão, link ou arquivo enviado). RLS de escrita
// (docs/020_conclusao_etapa_e_rls_arquivos.sql) já garante que só o
// professor do projeto correspondente ao dono consegue inserir.
export async function inserirAnexoLink(
  supabase: SupabaseClient,
  params: {
    donoTipo: DonoArquivo;
    donoId: string;
    userId: string;
    url: string;
    nome: string;
  },
) {
  await supabase.from("arquivos").insert({
    dono_tipo: params.donoTipo,
    dono_id: params.donoId,
    nome: params.nome,
    url: params.url,
    tipo: "link",
    enviado_por: params.userId,
  });
}

// `path` é o caminho no bucket 'entregas-arquivos' (mesmo bucket e convenção
// de URL assinada já usados pelo upload de arquivo em Entrega — ver
// lib/entregas/url-assinada.ts), não uma URL pública.
export async function inserirAnexoArquivo(
  supabase: SupabaseClient,
  params: {
    donoTipo: DonoArquivo;
    donoId: string;
    userId: string;
    nome: string;
    path: string;
  },
) {
  await supabase.from("arquivos").insert({
    dono_tipo: params.donoTipo,
    dono_id: params.donoId,
    nome: params.nome,
    url: params.path,
    tipo: "arquivo",
    enviado_por: params.userId,
  });
}
