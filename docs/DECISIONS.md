# Decisões do Projeto
## Vessia

Log de decisões de produto e engenharia, no formato Contexto / Decisão / Consequência. Cada entrada existe para não reabrir a mesma discussão dois meses depois. Toda decisão arquitetural relevante entra aqui, mesmo que já esteja documentada em outro lugar.

---

### 2026-07 — Dependências entre missões específicas, não entre etapas
**Contexto:** se etapas inteiras liberassem de uma vez, várias missões abririam simultaneamente.
**Decisão:** dependência é definida entre missões específicas.
**Consequência:** o aluno nunca vê mais do que o necessário disponível ao mesmo tempo; modelagem de dependência exige um grafo simples entre missões (não entre etapas).

---

### 2026-07 — Participação como entidade própria
**Contexto:** uma missão pode ter várias vagas; "responsável" no singular não representa isso.
**Decisão:** criar entidade Participação (aluno + missão), separada da missão em si.
**Consequência:** cada aluno tem sua própria entrega e resultado, independente dos demais participantes da mesma missão.

---

### 2026-07 — Status da participação separado do resultado da aprovação
**Contexto:** "aprovada com ressalvas" não é um novo estado do fluxo, é uma decisão sobre a entrega.
**Decisão:** status (em andamento / em aprovação / concluída) e resultado (aprovada / aprovada com ressalvas / rejeitada) são campos distintos.
**Consequência:** evita misturar "onde a participação está" com "o que o professor decidiu sobre ela".

---

### 2026-07 — Toda missão tem 4 elementos obrigatórios
**Contexto:** sem isso, era fácil criar missões vagas ou sem propósito claro.
**Decisão:** toda missão declara objetivo, entrega, critério de avaliação e dependências.
**Consequência:** elimina ambiguidade sobre por que a missão existe e como será julgada; missões que não respondem a isso não deveriam existir.

---

### 2026-07 — Campo "tipo" na Missão
**Contexto:** o aluno precisa reconhecer rapidamente a natureza do trabalho antes de abrir a missão.
**Decisão:** adicionar campo tipo (Estudar, Entrevistar, Escrever, Desenvolver, Testar, Revisar, Apresentar).
**Consequência:** campo estrutural, sem impacto em regra de negócio no MVP — só ajuda a interface.

---

### 2026-07 — "Competências desenvolvidas" fora do MVP
**Contexto:** é a base de um futuro "perfil de competência do aluno", já adiado.
**Decisão:** não formalizar como campo agora.
**Consequência:** fica só como referência informal no rascunho de template; sem nada consumindo o dado, seria documentação decorativa.

---

### 2026-07 — Gestor opera via login de Professor
**Contexto:** a plataforma só tem dois papéis de login (Professor e Aluno); o Gestor (papel do mundo real) ainda não foi formalmente separado em funções.
**Decisão:** toda ação do Gestor dentro do sistema usa o login de Professor.
**Consequência:** nenhum papel novo de login no MVP; se o Gestor for dividido em funções no futuro, isso muda sem redesenhar o modelo de Usuário.

---

### 2026-07 — Conclusão de missão com múltiplas vagas é manual
**Contexto:** com vagas parcialmente preenchidas ou aprovadas, não existe uma regra automática que sirva para todos os casos.
**Decisão:** o professor marca manualmente quando a missão está concluída, independente do estado das participações individuais.
**Consequência:** aceita **só para o MVP**. No futuro, isso pode virar configurável por missão (algumas exigem todos os participantes aprovados, outras só o mínimo) — não tratar como comportamento definitivo.

---

### 2026-07 — Status da Missão é sempre calculado, nunca armazenado
**Contexto:** um status salvo pode ficar inconsistente com a realidade (ex: "disponível" salvo com dependência ainda pendente).
**Decisão:** armazenar apenas `concluída_em`; derivar bloqueada/disponível/em andamento a partir de dependências e participações em tempo real.
**Consequência:** elimina uma classe inteira de bug de sincronização de estado.

---

### 2026-07 — Anexo como entidade própria (Arquivo)
**Contexto:** o mesmo conceito de anexo se repete em Projeto, Missão, Entrega e Avaliação.
**Decisão:** modelar Arquivo como entidade polimórfica única, em vez de campo duplicado em cada entidade.
**Consequência:** só Missão e Entrega usam isso no MVP, mas Projeto e Avaliação podem usar a mesma entidade depois, sem redesenho.

---

### 2026-07 — Projeto ganha campos de criação/encerramento
**Contexto:** essas informações apareceriam em praticamente toda tela de qualquer forma.
**Decisão:** adicionar criado_por, criado_em, encerrado_por, encerrado_em ao Projeto.
**Consequência:** não é para fins de auditoria — é contexto de uso comum, disponível desde o início.

---

### 2026-07 — Motor de templates, marketplace, white label e multi-tenant fora do primeiro ciclo
**Contexto:** essas ideias surgiram repetidamente ao longo da conversa e ameaçavam expandir o escopo do MVP antes de validar qualquer coisa com um projeto real.
**Decisão:** o modelo (Projeto → Etapa → Missão) já é genérico o suficiente para suportar isso no futuro, mas nada disso é construído agora.
**Consequência:** nenhuma tabela de Cliente, Template ou multi-tenant existe no MVP. Revisitar só se um segundo contexto real (não hipotético) aparecer.

---

### 2026-07 — Template de Desenvolvimento de Software rebaixado a rascunho
**Contexto:** generalizar um template antes de rodar um projeto real corre o risco de ser baseado em hipótese, não em experiência.
**Decisão:** o template escrito antes do Bíblia 3D vira material de apoio informal, não documento oficial da sequência.
**Consequência:** o template oficial será extraído depois que o Bíblia 3D validar o que de fato se repete entre projetos.

---

### 2026-07 — Entidade Comentário adiada
**Contexto:** existem casos reais previsíveis (professor comenta uma missão, aluno pergunta, discussão sobre entrega) que hoje vão para WhatsApp.
**Decisão:** não modelar agora.
**Consequência:** registrado como evolução prevista; entra no modelo só quando a comunicação fora da plataforma virar um problema real, não hipotético.

---

### 2026-07 — Testes automatizados substituem roteiro manual de teste
**Contexto:** cada bloco do plano de implementação vinha terminando com um roteiro de teste manual (X passos no navegador) para o Gestor validar. Isso ficou insustentável conforme os blocos foram ficando mais densos (Bloco 6, com validação de ciclo, já exigia 9 passos manuais).
**Decisão:** a partir do Bloco 7, cada bloco inclui escrever e rodar testes automatizados (Vitest para lógica pura, Playwright para fluxos ponta a ponta) como parte da própria tarefa — o resultado reportado é a saída real da execução, não uma lista de passos para o Gestor repetir.
**Consequência:** o Gestor deixa de ser o executor de testes de regressão a cada bloco nesse ritmo; passa a revisar resultados de execução real e só testar manualmente pontos específicos de UX que teste automatizado não cobre bem (sensação de uso, clareza visual).

---

### 2026-07 — Assistente de criação (wizard) adiado
**Contexto:** um wizard de criação de projeto/etapas economiza trabalho quando existem vários professores criando vários projetos com frequência.
**Decisão:** não construir no MVP — hoje é um projeto, criado uma vez, por um professor. Formulário simples resolve.
**Consequência:** registrado como ideia de UX futura, não como requisito de implementação.

---

### 2026-07 — Testes automatizados (Vitest + Playwright) a partir do Bloco 6
**Contexto:** conforme a complexidade cresceu (dependências com validação de ciclo, RLS em três camadas), confirmar comportamento manualmente ficou menos confiável do que testes escritos.
**Decisão:** unitários (Vitest) para lógica pura (cálculo de status, validação de ciclo) e end-to-end (Playwright) para os fluxos críticos, com contas de teste dedicadas (e2e.*) criadas e destruídas a cada execução via service role.
**Consequência:** cada bloco a partir daqui reporta resultado real de teste, não só descrição do que foi implementado. Custo: execuções repetidas de teste de cadastro esbarram na cota de e-mail padrão do Supabase (ver TECH-DEBT.md).

---

### 2026-07 — Casos de Uso e Jornada do Usuário fundidos em um documento
**Contexto:** os dois descreviam a mesma informação (fluxos do sistema) por ângulos diferentes (por ação vs. por papel), o que inflaria a documentação sem reduzir ambiguidade nova.
**Decisão:** um único documento (`05 - Fluxos.md`) cobre casos de uso e jornada por papel.
**Consequência:** menos documentos para manter sincronizados; wireframes derivam diretamente desse documento único.

---

### 2026-07 — Especificação de Telas e Wireframes fundidos em um documento
**Contexto:** mesmo padrão do item anterior — especificação de tela e rabisco de wireframe descrevem a mesma tela por ângulos diferentes.
**Decisão:** um único documento (`06 - Telas.md`) cobre especificação funcional + rabisco de cada tela.
**Consequência:** cada tela documentada uma vez só; estética explicitamente fora de escopo do documento.

---

### 2026-07 — Nome do projeto: Vessia
**Contexto:** os documentos usavam "Plataforma da Empresa Júnior" como nome provisório.
**Decisão:** o projeto se chama Vessia (domínio vessia.com.br já registrado).
**Consequência:** nome oficial a partir de agora; documentos e repositório podem adotar o nome em títulos e branding.

---

### 2026-07 — Stack técnica: Next.js + Supabase + Tailwind
**Contexto:** a sugestão inicial era Spring Boot/Java/Angular, mas isso ignora a stack que o Gestor já opera em produção em outros projetos (Zapte, RankBR, desenho do página-aluno). Java aqui é o assunto do curso que a Empresa Júnior ensina, não necessariamente a stack de implementação da própria plataforma.
**Decisão:** Next.js (frontend + backend via API routes), Supabase (Postgres + Auth), Tailwind para estilo.
**Consequência:** reaproveita conhecimento e infraestrutura já dominados, reduz a curva de implementação solo. Pode ser revisto se surgir um motivo técnico concreto durante a implementação.