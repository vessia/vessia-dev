# Plano de Implementação
## Vessia

Tarefas pequenas, sequenciais, cada uma produzindo algo executável e verificável — sem depender de blocos futuros grandes. Ordem: identidade primeiro, domínio depois.

---

## Bloco 1 — Fundação

1. Criar projeto Next.js (App Router, TypeScript, Tailwind).
2. Criar projeto no Supabase; copiar URL e chaves para `.env.local`.
3. Rodar `001_initial_schema.sql` no Supabase (SQL editor ou CLI).
4. Instalar e configurar o client Supabase no Next.js; testar a conexão (query simples, ex: `select 1`).

## Bloco 2 — Autenticação

5. Criar página de login (`/login`) com e-mail/senha.
6. Criar página de cadastro (`/cadastro`) com nome, e-mail, senha, papel — ao criar o usuário no Supabase Auth, criar a linha correspondente em `profiles`.
7. Criar rota de callback de autenticação.
8. Criar middleware de sessão (protege rotas que exigem login).
9. Criar página protegida simples (`/dashboard`) que só mostra "Olá, {nome}" — valida que auth + profiles estão funcionando ponta a ponta.

## Bloco 3 — Layout base

10. Criar layout com navegação mínima, condicional por papel (Professor vê itens de gestão, Aluno não).

## Bloco 4 — CRUD Projeto (Professor)

11. Listar projetos (`/projetos`).
12. Criar projeto (formulário conforme `06 - Telas.md`, seção 1 aplicável).
13. Editar / encerrar projeto.

## Bloco 5 — CRUD Etapa (Professor)

14. Listar etapas de um projeto.
15. Criar etapa (nome, ordem).
16. Editar / reordenar etapas.

## Bloco 6 — CRUD Missão (Professor)

17. Listar missões de uma etapa.
18. Criar missão (tela conforme `06 - Telas.md`, seção 8) — validar os 4 campos obrigatórios antes de salvar.
19. Definir dependências entre missões — validar ciclo na aplicação (ver `05 - Fluxos.md`) antes de salvar.
20. Editar missão.

## Bloco 7 — Mapa do Aluno

21. Implementar a view `missoes_com_status` no client (ou query equivalente) e a lógica de status por aluno (seção 3 do `05 - Fluxos.md` — combina status da missão + status da participação do próprio aluno).
22. Tela de mapa do projeto (`06 - Telas.md`, seção 3).
23. Tela de detalhe da missão (`06 - Telas.md`, seção 4).

## Bloco 8 — Participação e Entrega (Aluno)

24. Ação "Participar" — validar vaga e duplicidade antes de criar a Participação.
25. Tela e ação de envio de entrega — validar limite de reenvios antes de criar a Entrega.

## Bloco 9 — Avaliação (Professor)

26. Dashboard do professor (`06 - Telas.md`, seção 6) — lista de pendências e atrasos.
27. Tela de avaliação de entrega (`06 - Telas.md`, seção 7) — aprovar / ressalvas / rejeitar, com feedback obrigatório em rejeição.
28. Ação "marcar missão como concluída" (manual, pelo professor).

## Bloco 10 — Onboarding

29. Etapa 0 (onboarding) como fluxo próprio, com autoavaliação (`06 - Telas.md`, seção 2).

## Bloco 11 — Validação com dados reais

30. Cadastrar o Bíblia 3D de verdade (Etapa 0 + Descoberta, conforme `03 - Projeto Bíblia 3D.md`).
31. Um aluno de teste completa o fluxo do início ao fim, sem ajuda.
32. Um professor de teste aprova/rejeita/avalia sem coordenar nada fora da plataforma.

---

Cada tarefa concluída corresponde a um item do `MVP-CHECKLIST.md` — ao terminar um bloco, marcar lá.
