export const TIPOS_MISSAO = [
  { value: "estudar", label: "Estudar", icone: "📖" },
  { value: "entrevistar", label: "Entrevistar", icone: "🎤" },
  { value: "escrever", label: "Escrever", icone: "✍️" },
  { value: "desenvolver", label: "Desenvolver", icone: "💻" },
  { value: "testar", label: "Testar", icone: "🧪" },
  { value: "revisar", label: "Revisar", icone: "🔍" },
  { value: "apresentar", label: "Apresentar", icone: "📢" },
] as const;

export type TipoMissao = (typeof TIPOS_MISSAO)[number]["value"];

export function tipoMissaoInfo(tipo: string) {
  return TIPOS_MISSAO.find((t) => t.value === tipo) ?? { label: tipo, icone: "•" };
}
