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

### 2026-07 — Onboarding não reaproveita Missão/Participação/Entrega/Avaliação
**Contexto:** os 3 itens da Etapa 0 são autoavaliados pelo próprio aluno, sem entrega nem aprovação do professor — encaixar isso no fluxo de Missão real exigiria estados especiais espalhados por todo o domínio principal.
**Decisão:** tabela dedicada `onboarding_progresso` (aluno_id, item, concluido_em), com os 3 itens fixos no código, fora do modelo de Projeto/Etapa/Missão.
**Consequência:** onboarding fica desacoplado do domínio principal — mais simples de raciocinar, sem contaminar as regras de Missão com um caso especial. Se no futuro o onboarding precisar variar por contexto (não só Empresa Júnior), essa tabela precisará ser revisitada.

---

### 2026-07 — Cadastro público não pode mais criar conta de Professor
**Contexto:** validação com dados reais (Bloco 11) revelou que qualquer pessoa podia se autocadastrar como professor, com escrita total via RLS em qualquer projeto — risco de segurança real, não hipotético.
**Decisão:** remover a opção "professor" do formulário público de `/cadastro`; cadastro público só cria conta de aluno. A(s) conta(s) de professor são criadas manualmente (hoje, uma única conta, a do Gestor).
**Consequência:** nenhum painel de admin é necessário para isso agora — só existe um professor. Um painel de administração para criar/gerenciar múltiplos professores fica adiado até existir essa necessidade real.

---

### 2026-07 — Nomes de perfil configuráveis / white-label recusado novamente
**Contexto:** a mesma ideia de generalização (motor de templates, marketplace, white label, multi-tenant) reapareceu, desta vez como "admin configura os nomes dos papéis".
**Decisão:** não construir. Continua valendo a decisão já registrada de que isso só entra quando existir um segundo cliente real, não hipotético.
**Consequência:** nenhuma mudança de modelo. Papéis continuam sendo o enum fixo `professor`/`aluno`.

---

### 2026-07 — Canvas infinito (tipo Excalidraw/n8n) para o mapa de missões — adiado
**Contexto:** ideia de substituir a lista atual do mapa por um editor visual em nós e conexões.
**Decisão:** tecnicamente factível (ex: biblioteca React Flow), mas não entra agora — reformularia uma tela que já está construída, testada, e ainda nem foi validada com alunos reais.
**Consequência:** registrado como evolução de UX futura, sem nenhuma mudança no MVP atual.

---

### 2026-07 — Projeto passa a ter múltiplos professores (proprietário + colaboradores)
**Contexto:** requisito real, não hipotético — o próprio Bíblia 3D, primeiro projeto real, já tem pelo menos 2 professores.
**Decisão:** nova entidade `ProjetoProfessor` (projeto + professor + papel: proprietário ou colaborador). Quem cria o projeto vira proprietário automaticamente. Só o proprietário pode adicionar/remover outros professores do projeto. Colaborador tem exatamente as mesmas permissões de escrita dentro do projeto (etapas, missões, avaliações) que o proprietário — a única diferença é não poder gerenciar quem mais é professor daquele projeto.
**Consequência:** escrita em etapas/missões/avaliações deixa de ser "qualquer professor" e passa a ser "professor vinculado àquele projeto especificamente" — muda a RLS de várias tabelas, não só a interface.

---

### 2026-07 — Aluno precisa ser atribuído a um projeto pelo professor, não escolhe livremente
**Contexto:** requisito real — o fluxo correto é o professor decidir quem participa de qual projeto, não o aluno se autoinscrever em qualquer projeto que veja.
**Decisão:** nova entidade `ProjetoAluno` (projeto + aluno + status: convidado / aceito / recusado / saiu / removido). Professor atribui (cria como "convidado"); aluno aceita ou recusa; aluno pode sair a qualquer momento depois de aceitar; professor pode remover a qualquer momento depois de aceitar. Aluno só enxerga e participa das missões de um projeto quando o status é "aceito".
**Consequência:** leitura de projeto/etapas/missões deixa de ser geral para qualquer autenticado e passa a ser escopada pela atribuição. Ao sair ou ser removido, participações e entregas já existentes daquele aluno **permanecem como histórico** (o professor continua vendo o que foi feito), mas o aluno perde a possibilidade de agir novamente naquele projeto.

---

### 2026-07 — Entregas passam a suportar upload de imagem e PDF
**Contexto:** necessidade real de uso — alunos da Empresa Júnior (usuários adultos da Vessia, não confundir com as crianças que são o público final do curso Bíblia 3D) precisam poder mandar imagem (ex: print de código, desenho, foto de anotação) ou PDF (ex: PRD do projeto, documento escrito) como entrega, não só texto/link. O campo `tipo_conteudo = 'arquivo'` já existia no schema desde o Bloco 6, mas tinha sido deliberadamente deixado sem implementação (ver decisão do Bloco 6 sobre anexos simplificados).
**Decisão:** usar Supabase Storage (bucket privado). `entregas.conteudo` passa a guardar o caminho do arquivo no Storage quando `tipo_conteudo = 'arquivo'`. Upload restrito a tipos de imagem comuns (png, jpg/jpeg, webp, gif) e PDF, com limite de tamanho (5MB para imagem, 10MB para PDF) nesta primeira versão. Leitura do arquivo é feita via URL assinada de curta duração, gerada no servidor depois de confirmar que quem pede pertence ao projeto daquela entrega (mesma checagem de acesso já usada em todo o resto — não duplicada nas policies do Storage).
**Consequência:** não muda o modelo de dados (o campo já existia); é implementação da opção que já estava prevista. Outros tipos de arquivo (áudio, vídeo, etc.) ficam fora por ora — ampliar é trivial (só mudar a whitelist) se a necessidade aparecer.

---

### 2026-07 — Termos de Uso e Política de Privacidade publicados como rascunho
**Contexto:** obrigação legal básica de qualquer produto que trata dados pessoais — usuários da Vessia são adultos (Empresa Júnior), não as crianças do curso Bíblia 3D (essas nunca usam a Vessia diretamente).
**Decisão:** publicar um rascunho real (não placeholder) em `TERMOS-E-PRIVACIDADE.md`, exigir aceite explícito no cadastro, revisar com advogado antes de qualquer uso em maior escala.
**Consequência:** campos marcados "[A DEFINIR]" no documento (base legal específica, e-mail de contato, foro) precisam ser preenchidos antes da revisão jurídica formal.

---

### 2026-07 — Onboarding passa a ser revisável, não só um gate único
**Contexto:** hoje a Etapa 0 só aparece uma vez, bloqueando o acesso até ser concluída; não havia forma de revisitar o conteúdo depois.
**Decisão:** manter o gate para quem ainda não completou, mas permitir acesso a qualquer momento (modo leitura) para quem já completou, via link visível na navegação.
**Consequência:** nenhuma mudança de modelo — onboarding_progresso já registra o que foi concluído; só muda o comportamento de acesso à rota.

---

### 2026-07 — Tooltips explicativos nos conceitos do domínio
**Contexto:** reduzir a chance de o usuário ficar sem entender um termo (Missão, Vagas, Dependência, status) sem precisar reler a documentação ou perguntar.
**Decisão:** componente de tooltip reutilizável, com texto derivado das definições já existentes em `01 - Visão.md` (seção 4 — Conceitos), aplicado nos pontos de maior ambiguidade da interface.
**Consequência:** copy centralizado (não duplicado por tela), para não haver definições divergentes do mesmo conceito em lugares diferentes.

---

### 2026-07 — Termo específico por Projeto (opcional), separado dos Termos de Uso globais
**Contexto:** necessidade real — no contexto do Bíblia 3D, os alunos precisam reconhecer explicitamente que o trabalho não tem caráter trabalhista, não prevê remuneração, e é de natureza pedagógica, antes de participar de qualquer missão. Isso é específico daquele projeto, não da plataforma como um todo — outro projeto pode não precisar de nada disso.
**Decisão:** `Projeto` ganha um campo opcional `termo_especifico` (texto, definido pelo professor ao criar/editar o projeto). `ProjetoAluno` ganha `termo_aceito_em`. Se o projeto tem termo definido, o aluno precisa aceitá-lo (registrando a data) antes de conseguir criar sua primeira Participação naquele projeto — mesmo já estando com o convite aceito. Se o projeto não define termo nenhum, esse passo simplesmente não existe (`termo_aceito_em` fica sempre nulo, sem bloquear nada).
**Consequência:** aceitar o convite do projeto e aceitar o termo do projeto são dois fatos distintos, verificados separadamente — não a mesma ação. Isso é intencional: o aluno pode ver do que se trata o projeto antes de precisar concordar com as condições específicas dele.

---

### 2026-07 — Criação de novo Projeto temporariamente desativada por feature flag
**Contexto:** hoje só existe um projeto real (Bíblia 3D), com mais de um professor vinculado. Sem um painel de admin ainda, Caio quer controlar manualmente quando novos projetos podem ser criados, para evitar que um colaborador crie um projeto separado por engano em vez de atuar dentro do Bíblia 3D.
**Decisão:** feature flag (variável de ambiente, checada no servidor, não só escondendo o botão) desativa a ação de criar projeto para todo mundo, incluindo o proprietário — não é uma permissão por papel ou por usuário, é um interruptor geral e temporário.
**Consequência:** reversível trocando a variável de ambiente, sem precisar de deploy de código novo. Não muda o modelo de permissões — colaboradores continuam com todas as permissões de professor dentro dos projetos aos quais já estão vinculados, conforme já decidido. Isso deixa de ser necessário assim que existir um painel de admin (ver TECH-DEBT.md).

---

### 2026-07 — Widget de feedback guiado, dentro do app
**Contexto:** com o Bíblia 3D prestes a rodar com usuários reais, vale coletar sinal estruturado de uso em vez de esperar reclamação informal por fora da plataforma.
**Decisão:** botão de feedback visível em qualquer página autenticada (não na landing pública), abrindo um formulário curto e guiado — não um campo de texto livre solto. Três perguntas fixas: (1) avaliação rápida (escala 1-5) de como está a experiência até agora; (2) múltipla escolha do que mais incomoda (opções pré-definidas, ex: "não sei o que fazer", "muito clique pra pouca coisa", "tela confusa", "está bom"); (3) campo de texto livre opcional, só pra quem quiser detalhar. Guarda também a página de origem do envio.
**Consequência:** nova entidade simples (Feedback), sem tela de administração para visualizar ainda — leitura direto pela tabela no Supabase por enquanto, já que só existe um professor consultando isso. Construir uma tela de visualização só se o volume justificar.

---

### 2026-07 — Termos de Uso e Privacidade não mencionam a Fuctura
**Contexto:** a Vessia não é um produto da Fuctura — a Fuctura é o primeiro caso de uso, não a dona da plataforma. Os documentos legais (públicos) precisam refletir isso, mesmo que os documentos internos de produto (Visão, Método, Bíblia 3D) continuem descrevendo o contexto real de uso.
**Decisão:** remover toda menção à Fuctura e à Empresa Júnior dos Termos de Uso e Política de Privacidade. O responsável legal pelo tratamento de dados (seção 1 da Privacidade) passa a ser Caio de Matos Vital, pessoa física, marcado explicitamente como provisório até a operação ser formalizada como empresa.
**Consequência:** documentos internos e documentos públicos agora contam a história em dois níveis diferentes de propósito — interno explica o "por quê" e o contexto real; público descreve só o produto em si. Isso precisa ser revisitado quando (e se) a Vessia virar uma empresa formal, principalmente a seção de responsável legal.

---

### 2026-07 — Bíblia 3D adota estrutura de 8 etapas, detalhadas só até o PRD
**Contexto:** "Etapa" sempre foi um campo de texto livre no modelo (nunca um enum fechado), então ampliar de 6 para 8 etapas não exige mudança de schema. Mas etapas como Design e Desenvolvimento vieram com missões que presumem arquitetura técnica (Backend/Frontend/Banco) ainda não confirmada — nenhuma entrevista aconteceu.
**Decisão:** adotar as 8 etapas (Descoberta, Planejamento do Produto, Design, Desenvolvimento, Testes, Homologação, Deploy, Encerramento) como estrutura do projeto. Detalhar missões de verdade só até a Etapa 2 (Planejamento do Produto) — que ainda é trabalho de documento, não presume tecnologia. Etapas 3 a 8 existem como nome/ordem/entrega esperada, sem missões, até o PRD ser aprovado.
**Consequência:** mesma disciplina já usada desde o Bloco 11 — não inventar estrutura técnica antes de ter informação real pra sustentá-la.

---

### 2026-07 — Missão pode ter vagas ilimitadas
**Contexto:** validação real com o Bíblia 3D — um professor precisou colocar um número arbitrário (20) só pra simular "sem limite", porque o campo `vagas` exigia um inteiro positivo.
**Decisão:** `vagas` passa a aceitar nulo, com o significado explícito de "sem limite". A checagem de vaga disponível (`podeParticipar`) ignora o teto quando `vagas` é nulo. A interface mostra "X participando (sem limite)" em vez de "X de Y preenchidas" nesse caso.
**Consequência:** pequena mudança de schema (coluna passa a aceitar null) e de lógica de validação — já existia a checagem, só precisa de um branch a mais para o caso nulo.

---

### 2026-07 — Busca de aluno/professor por e-mail, não só nome
**Contexto:** validação real — nome sozinho é ambíguo e difícil de buscar com precisão; `profiles` não tinha e-mail replicado, só existia em `auth.users`.
**Decisão:** adicionar `email` a `profiles` (sincronizado no cadastro), e a busca de atribuição de aluno/professor passa a considerar nome OU e-mail.
**Consequência:** pequena duplicação de dado (e-mail já existe em `auth.users`) em troca de busca funcional sem precisar de service role toda vez que alguém for atribuído a um projeto.

---

### 2026-07 — URL amigável (slug) por projeto — reconsiderada, ainda adiada
**Contexto:** essa ideia apareceu antes (sugestão do ChatGPT) e foi recusada por falta de caso de uso real. Agora existe um caso real: navegar por UUID é desconfortável na prática.
**Decisão:** continua adiada — não porque o caso de uso deixou de ser real, mas porque é a mudança mais cara da lista (toca todas as rotas aninhadas de projeto: etapas, missões, alunos, professores, edição) para um ganho puramente estético, sem nenhuma função quebrada por causa disso. Os outros itens encontrados na mesma sessão de teste (404 pouco amigável, busca por e-mail, vagas sem limite, bug de navegação) têm impacto funcional real e custo menor — esses vêm primeiro.
**Consequência:** revisitar quando o restante da lista estiver resolvido, não antes.

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