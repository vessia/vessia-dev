# MVP Checklist
## Vessia

A partir daqui, qualquer ideia nova (gamificação, comentários, templates, marketplace, wizard de criação...) só entra depois que TODOS os itens abaixo estiverem marcados. Este documento é a referência de "o que precisamos construir", não "o que podemos imaginar".

---

## Fundação
- [x] Login e cadastro (Professor / Aluno)
- [x] Autenticação persistente (sessão)

## Núcleo do domínio
- [x] CRUD de Projeto (criar, editar, encerrar)
- [x] CRUD de Etapa (criar, editar, ordenar)
- [x] CRUD de Missão (título, tipo, objetivo, entrega, critério, prazo, vagas, obrigatória, limite de reenvios, anexos)
- [x] Dependências entre missões (com bloqueio de ciclo)
- [x] Cálculo de status da Missão (bloqueada/disponível/em andamento/concluída — derivado, não armazenado)

## Participação e avaliação
- [x] Aluno participa de missão (com checagem de vaga e de duplicidade)
- [x] Aluno envia entrega (com checagem de limite de reenvio)
- [x] Professor avalia entrega (aprovar / aprovar com ressalvas / rejeitar, com feedback obrigatório em rejeição)
- [x] Professor marca missão como concluída manualmente
- [x] Desbloqueio automático de missões dependentes

## Telas
- [ ] Onboarding (Etapa 0)
- [x] Mapa do projeto (visão do aluno)
- [x] Detalhe da missão (visão do aluno)
- [x] Envio de entrega
- [x] Dashboard do professor
- [x] Avaliação de entrega (visão do professor)
- [x] Criação/edição de missão (visão do professor)

## Validação final
- [ ] Bíblia 3D cadastrado do início ao fim (Etapa 0 + Descoberta, no mínimo)
- [ ] Um aluno real consegue completar o fluxo sem perguntar nada a ninguém
- [ ] Um professor real consegue acompanhar e aprovar sem coordenar nada manualmente fora da plataforma

---

Referência cruzada: cada item aqui corresponde a uma regra já decidida em `01 - Visão.md`, `04 - Modelo Conceitual.md`, `05 - Fluxos.md` ou `06 - Telas.md`. Se durante a implementação surgir uma dúvida sobre "como isso deveria funcionar", a resposta já está em algum desses quatro documentos — antes de inventar, procurar lá.