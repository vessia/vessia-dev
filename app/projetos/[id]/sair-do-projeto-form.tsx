"use client";

import { sairDoProjeto } from "./alunos/actions";
import { SubmitButton } from "@/app/_components/submit-button";

// DECISIONS.md, "Confirmação antes de sair de um projeto": ação
// destrutiva/irreversível do ponto de vista do aluno (perde acesso a
// novas missões) — dialog nativo é suficiente, não precisa de modal
// customizado. Client Component só por causa do onSubmit; a Server
// Action em si não muda.
export function SairDoProjetoForm({
  projetoId,
  nomeProjeto,
}: {
  projetoId: string;
  nomeProjeto: string;
}) {
  return (
    <form
      action={sairDoProjeto}
      className="w-fit"
      onSubmit={(e) => {
        const confirmado = window.confirm(
          `Tem certeza que quer sair do projeto ${nomeProjeto}? Seu histórico de entregas e avaliações continua visível para o professor, mas você perde acesso a novas missões.`,
        );
        if (!confirmado) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="projeto_id" value={projetoId} />
      <SubmitButton variant="danger" pendingText="Saindo...">
        Sair do projeto
      </SubmitButton>
    </form>
  );
}
