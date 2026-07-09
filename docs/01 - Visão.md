# Visão do Produto
## Vessia — plataforma da Empresa Júnior (Fuctura)

Versão 1.0 (congelada) — Julho de 2026

---

## 0. Identidade

A Vessia é um sistema de execução de projetos baseado em missões. Seu objetivo é transformar um projeto real em uma sequência de atividades organizadas, permitindo que alunos aprendam enquanto desenvolvem soluções para clientes reais.

Este sistema não é um gerenciador de tarefas. É um ambiente de aprendizagem baseado em projetos reais. Todas as decisões de interface, fluxo e regras de negócio devem priorizar a aprendizagem do aluno antes da complexidade da gestão do projeto.

---

## 1. O que é essa plataforma?

É um sistema onde os alunos da Empresa Júnior da Fuctura enxergam, a qualquer momento, três coisas: em que ponto o projeto está, o que já pode ser feito agora, e o que falta para o projeto avançar.

O projeto é organizado como uma sequência de etapas. Dentro de cada etapa existem missões — unidades de trabalho com objetivo, responsáveis, prazo e entrega. Uma missão só fica disponível quando as missões das quais ela depende já foram concluídas e aprovadas pelo professor.

Não existe Kanban, backlog ou sprint na tela do aluno. Existe um mapa de missões, bloqueadas ou disponíveis, que ele percorre conforme o projeto avança.

---

## 2. Por que ela existe?

Hoje, quando um aluno entra na Empresa Júnior, ele não tem uma forma clara de saber o que precisa fazer. O trabalho é combinado verbalmente, em grupo, ou depende de o professor lembrar de avisar cada aluno individualmente. Isso gera dois problemas recorrentes:

- **O aluno fica parado**, esperando alguém dizer o próximo passo, porque não existe um lugar único que mostre isso.
- **O professor vira gargalo**, porque é ele quem carrega na cabeça o estado de tudo — quem está fazendo o quê, o que já foi aprovado, o que está atrasado.

A plataforma existe para resolver isso: tirar do professor a necessidade de coordenar tudo manualmente, e dar ao aluno autonomia para saber, sozinho, o que ele pode assumir a seguir.

---

## 3. Qual problema ela resolve?

O problema central é coordenação de um projeto real com participantes que nunca trabalharam em equipe antes.

Ferramentas profissionais de gestão de projeto (Jira, Trello, GitHub Projects) assumem que quem usa já entende conceitos como backlog, sprint, épico ou issue. Para um aluno iniciante, isso é uma segunda camada de dificuldade em cima do próprio projeto — ele precisa aprender a ferramenta antes de conseguir trabalhar.

A plataforma resolve isso invertendo a ordem: o aluno primeiro aprende a executar (participar de uma missão, entregar, receber aprovação, desbloquear a próxima), usando uma linguagem simples. A terminologia de mercado não precisa aparecer agora — isso fica como possibilidade futura, não como requisito do MVP.

---

## 4. Conceitos

Esta seção define a linguagem oficial do produto. Todo o restante do documento — e do sistema — usa esses termos com este significado exato.

**Projeto**
É o trabalho que será desenvolvido. Exemplo: Bíblia 3D.

**Etapa**
Representa um marco do projeto. Organiza missões relacionadas e serve como indicador de progresso — não é apenas um agrupador visual. Uma etapa é considerada concluída quando todas as missões obrigatórias pertencentes a ela estiverem aprovadas (com ou sem ressalvas). Isso permite exibir o progresso do projeto etapa por etapa (ex: Descoberta 100%, PRD 60%, Desenvolvimento 20%).

**Missão**
Menor unidade de trabalho. Toda missão possui quatro elementos obrigatórios:
- **Objetivo** — por que ela existe.
- **Entrega** — o que deve ser produzido.
- **Critério de avaliação** — como será julgada pelo professor.
- **Dependências** — o que precisa estar concluído antes, e o que ela desbloqueia depois.

Uma missão nunca existe apenas para ocupar tempo. Se ela não responde a esses quatro pontos, ela não deveria existir como missão.

Além disso, cada missão pode ser marcada como **obrigatória** ou **opcional** — apenas missões obrigatórias contam para a conclusão da etapa. Cada missão também possui um **tipo**, que indica a natureza do trabalho esperado (ex: Estudar, Entrevistar, Escrever, Desenvolver, Testar, Revisar, Apresentar). O tipo não altera o comportamento do sistema no MVP — serve para o aluno reconhecer rapidamente que tipo de trabalho está pela frente antes mesmo de abrir a missão.

Uma missão pode ser criada manualmente por um usuário autorizado (no MVP, o professor) ou, futuramente, gerada automaticamente por um template. O MVP não implementa templates, mas o modelo não deve impedir essa evolução.

**Dependência**
Define quais missões precisam estar concluídas — e aprovadas — antes que outra possa ser iniciada. Dependências são definidas entre missões específicas, não entre etapas inteiras. Isso evita que várias missões abram de uma vez e deixem o aluno sem direção.

**Participação**
Um aluno não "assume" uma missão como dono exclusivo — ele participa dela. Uma missão pode ter várias vagas, e cada aluno que participa tem sua própria entrega e seu próprio status de aprovação, independente dos demais participantes da mesma missão.

---

## 5. Como será usada pela Empresa Júnior

O primeiro projeto real a rodar na plataforma é o Bíblia 3D.

O fluxo de uso, na prática:

1. O professor cadastra o projeto Bíblia 3D e monta as etapas e missões correspondentes (com prazos, vagas, responsáveis possíveis, anexos de apoio e dependências entre missões).
2. Os alunos entram na plataforma e veem o mapa do projeto: o que está disponível, o que está bloqueado, o que está em andamento.
3. Um aluno participa de uma missão disponível (por exemplo, "Entrevistar Cliente").
4. Ao concluir o trabalho, ele registra a entrega na plataforma.
5. O professor revisa a entrega e decide: aprovar, aprovar com ressalvas, ou rejeitar.
6. Quando a missão está aprovada (com ou sem ressalvas), ela é marcada como concluída e as missões que dependiam dela passam a ficar disponíveis.
7. O processo se repete até a etapa "Entrega" ser concluída.

O professor acompanha tudo por um painel simples: quem está fazendo o quê, o que está atrasado, e o que está pendente de aprovação.

---

## 6. Fluxo de aprovação

Aprovar uma entrega não é um evento binário e trivial — é o mecanismo que garante qualidade e controla o ritmo do projeto. As regras abaixo fazem parte do núcleo do produto, não são detalhe de implementação.

Status e resultado da aprovação são coisas diferentes e não devem ser misturados:

- **Status da participação** (o estado atual): em andamento → em aprovação → concluída.
- **Resultado da aprovação** (a decisão do professor, registrada a cada avaliação): aprovada / aprovada com ressalvas / rejeitada.

**Decisões possíveis do professor:**
- **Aprovar** — status vira "concluída", resultado "aprovada", sem observações.
- **Aprovar com ressalvas** — status vira "concluída" (desbloqueia dependências normalmente), resultado "aprovada com ressalvas", com um comentário do professor sobre o que poderia ter sido melhor. Serve como feedback pedagógico sem travar o progresso do projeto.
- **Rejeitar** — resultado "rejeitada", com feedback obrigatório. O status da participação retorna a "em andamento" para permitir reenvio.

**Reenvio após rejeição:**
Cada missão define seu próprio limite de reenvios (ex: até 2 tentativas). Ao atingir o limite sem aprovação, a missão fica sinalizada para intervenção do professor — o sistema não decide sozinho o que fazer nesse caso.

**Prazo estourado:**
Se uma missão passa do prazo sem entrega, ela não é cancelada nem reaberta automaticamente. Ela fica marcada como **bloqueada até o professor decidir** — o professor precisa agir (renegociar prazo, reatribuir, ou tomar outra ação) para o fluxo continuar. Isso evita que o sistema tome decisões pedagógicas por conta própria.

**Histórico:**
Toda decisão de aprovação (aprovar, aprovar com ressalvas, rejeitar) fica registrada com data e feedback, formando o histórico da participação — não apenas o status atual.

---

## 7. Qual é o fluxo completo

**Fluxo do professor:**

Criar projeto → criar etapas → criar missões (com prazo, vagas, responsáveis, anexos e dependências) → publicar → acompanhar entregas → aprovar, aprovar com ressalvas ou rejeitar → acompanhar progresso geral no dashboard.

**Fluxo do aluno:**

Entrar → ver o mapa do projeto → identificar missões disponíveis → participar de uma missão → executar → entregar → aguardar decisão do professor → ver a próxima missão desbloqueada (ou reenviar, se rejeitado).

Uma participação passa pelos seguintes estados: **em andamento** → **em aprovação** → **concluída** (aprovada ou aprovada com ressalvas) — ou volta para **em andamento** se rejeitada, respeitando o limite de reenvios da missão.

---

## 8. O que entra no MVP

- Login com dois papéis: Professor e Aluno.
- Cadastro de projetos (começando pela Bíblia 3D).
- Etapas fixas dentro de um projeto.
- Missões com: título, descrição, tipo, objetivo, critério de avaliação, etapa, obrigatória/opcional, prazo, vagas, responsáveis possíveis, anexos, limite de reenvios.
- Dependências entre missões específicas.
- Progresso da etapa calculado com base nas missões obrigatórias aprovadas.
- Participações: um registro por aluno por missão, com sua própria entrega, status e histórico de resultados.
- Fluxo de entrega do aluno e decisão do professor (aprovar / aprovar com ressalvas / rejeitar), com status e resultado tratados como campos separados, feedback obrigatório em rejeição, e histórico completo.
- Bloqueio automático de missão com prazo estourado, até ação do professor.
- Desbloqueio automático de missões dependentes após aprovação (com ou sem ressalvas).
- Dashboard do professor: visão de quem está fazendo o quê, atrasos e progresso do projeto.
- Visão do aluno: apenas o mapa de missões (sem funções administrativas).

---

## 9. O que fica para depois

Fica registrado como visão de médio e longo prazo, mas fora do primeiro ciclo:

- Motor de templates reutilizáveis (jornadas como instâncias de templates).
- Marketplace de templates e biblioteca de missões prontas.
- White label para outros contextos (cursos, onboarding, outras empresas).
- Gamificação (XP, medalhas, níveis).
- "Modo Profissional" (revelar terminologia de mercado — backlog, sprint, épico).
- Perfis de competência por aluno.
- Integrações (GitHub, Discord, IA para sugerir missões).
- Unificação futura, se fizer sentido, com o página-aluno — mas os dois seguem como projetos separados por ora.

Essas ideias não são descartadas. Elas só não são necessárias para a Empresa Júnior funcionar agora, e entrar nelas cedo demais é o que mais ameaça esse projeto sair do papel.

**A observar, sem decisão tomada:** ao listar as missões reais da Bíblia 3D, pode ficar claro que falta uma camada de agrupamento entre Etapa e Missão (ex: dentro de "PRD", agrupar "Objetivo", "Personas" e "Requisitos" sob algo maior). Essa camada não entra no modelo agora — só se um caso concreto mostrar que é necessária.

**Nota sobre generalização futura:** o modelo (Projeto → Etapa → Missão) já é genérico o suficiente para, no futuro, suportar outros contextos além da Empresa Júnior (outro curso, onboarding etc.) sem precisar ser redesenhado — mas isso significa apenas que a porta fica aberta, não que algo está sendo construído para isso agora. Nenhuma tabela de Cliente, Template ou multi-tenant faz parte do MVP.

---

## 10. Critério de sucesso do MVP

O MVP está funcionando quando: um aluno da Empresa Júnior consegue, sem perguntar a ninguém, saber qual missão participar a seguir no projeto Bíblia 3D — do início (Descoberta) até o fim (Entrega) — e o professor consegue acompanhar e aprovar o progresso todo, com histórico e critério claros, sem precisar coordenar isso manualmente.
