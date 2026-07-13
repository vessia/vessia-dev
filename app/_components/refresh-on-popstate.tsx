"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Investigação (relato real, Bíblia 3D): depois do botão voltar do
// navegador, um <Link> que estava visível e correto no snapshot restaurado
// não respondia ao clique — precisava de um segundo voltar/avançar pra
// "destravar". Causa: o Client Cache do App Router reaproveita a árvore
// renderizada de antes da navegação para frente (next/dist/docs — "Pages
// are not cached by default but are reused during browser back/forward
// navigation"), e essa árvore restaurada fica com a interatividade
// destravada até algo forçar uma nova renderização. router.refresh() no
// popstate força esse refresh sem esperar o usuário descobrir o truque
// sozinho.
export function RefreshOnPopstate() {
  const router = useRouter();

  useEffect(() => {
    function handlePopState() {
      router.refresh();
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  return null;
}
