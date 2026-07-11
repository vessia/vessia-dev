// Implementa 04 - Modelo Conceitual.md, seção 4: progresso da etapa é
// sempre calculado — proporção de missões obrigatórias concluídas sobre o
// total de missões obrigatórias da etapa. Nunca armazenado.
//
// Retorna null quando não há missão obrigatória na etapa — nesse caso a
// porcentagem não tem um significado honesto (0% sugeriria atraso, 100%
// sugeriria conclusão; nenhum dos dois é verdade quando não há nada
// obrigatório para concluir).
export function calcularProgressoEtapa(
  missoes: { obrigatoria: boolean; concluidaEm: string | null }[],
): number | null {
  const obrigatorias = missoes.filter((m) => m.obrigatoria);
  if (obrigatorias.length === 0) return null;

  const concluidas = obrigatorias.filter((m) => m.concluidaEm != null).length;
  return Math.round((concluidas / obrigatorias.length) * 100);
}
