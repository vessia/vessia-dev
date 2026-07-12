import { ITENS_ONBOARDING, type ChaveOnboarding } from "./constantes";

export type ItemOnboardingComEstado = {
  chave: ChaveOnboarding;
  titulo: string;
  texto: string;
  concluido: boolean;
  // Sequencial, igual à dependência entre as 3 missões em
  // 03 - Projeto Bíblia 3D.md: só libera o próximo quando o anterior está
  // concluído (06 - Telas.md, seção 2 — ✅ / 🟢 / 🔒).
  disponivel: boolean;
};

export function calcularProgressoOnboarding(
  itensConcluidos: readonly string[],
): ItemOnboardingComEstado[] {
  const concluidosSet = new Set(itensConcluidos);
  let anteriorConcluido = true;

  return ITENS_ONBOARDING.map((item) => {
    const concluido = concluidosSet.has(item.chave);
    const disponivel = anteriorConcluido;
    anteriorConcluido = concluido;
    return { ...item, concluido, disponivel };
  });
}

export function onboardingCompleto(itensConcluidos: readonly string[]): boolean {
  const concluidosSet = new Set(itensConcluidos);
  return ITENS_ONBOARDING.every((item) => concluidosSet.has(item.chave));
}
