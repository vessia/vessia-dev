import type { SupabaseClient } from "@supabase/supabase-js";

type Grafo = Map<string, string[]>;

// Constrói o grafo "missão depende de" para todas as missões do projeto.
// `excluirMissaoId` remove as arestas de saída da missão sendo editada,
// já que elas serão totalmente substituídas pela nova seleção.
export async function buscarGrafoDependencias(
  supabase: SupabaseClient,
  projetoId: string,
  opcoes?: { excluirMissaoId?: string },
): Promise<Grafo> {
  const { data: etapas } = await supabase
    .from("etapas")
    .select("id")
    .eq("projeto_id", projetoId);

  const etapaIds = (etapas ?? []).map((e) => e.id);
  if (etapaIds.length === 0) return new Map();

  const { data: missoes } = await supabase
    .from("missoes")
    .select("id")
    .in("etapa_id", etapaIds);

  const missaoIds = (missoes ?? []).map((m) => m.id);
  if (missaoIds.length === 0) return new Map();

  const { data: dependencias } = await supabase
    .from("missao_dependencias")
    .select("missao_id, depende_de_id")
    .in("missao_id", missaoIds);

  const grafo: Grafo = new Map();
  for (const dep of dependencias ?? []) {
    if (opcoes?.excluirMissaoId && dep.missao_id === opcoes.excluirMissaoId) {
      continue;
    }
    const lista = grafo.get(dep.missao_id) ?? [];
    lista.push(dep.depende_de_id);
    grafo.set(dep.missao_id, lista);
  }
  return grafo;
}

// `origem` já depende, direta ou indiretamente, de `alvo`?
function dependeTransitivamente(
  grafo: Grafo,
  origem: string,
  alvo: string,
): boolean {
  const visitados = new Set<string>();
  const pilha = [origem];

  while (pilha.length > 0) {
    const atual = pilha.pop()!;
    if (atual === alvo) return true;
    if (visitados.has(atual)) continue;
    visitados.add(atual);
    for (const proximo of grafo.get(atual) ?? []) {
      pilha.push(proximo);
    }
  }

  return false;
}

// Entre os ids propostos como dependência de `missaoId`, retorna o primeiro
// que fecharia um ciclo (a missão escolhida já depende, direta ou
// indiretamente, da própria `missaoId`), ou null se nenhum fechar.
export function encontrarDependenciaCiclica(
  grafo: Grafo,
  missaoId: string,
  dependeDeIds: string[],
): string | null {
  for (const dependeDeId of dependeDeIds) {
    if (dependeDeId === missaoId) return dependeDeId;
    if (dependeTransitivamente(grafo, dependeDeId, missaoId)) {
      return dependeDeId;
    }
  }
  return null;
}
