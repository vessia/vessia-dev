# Template — Desenvolvimento de Software
## Documento de referência para estruturar novos projetos

Versão 0.1 — Julho de 2026

---

## 0. O que é este documento

Este é um **documento de referência**, não uma funcionalidade da plataforma. Ele não é instalado, importado ou processado por nenhum sistema — é uma lista de missões genéricas, organizadas por etapa, que o Gestor consulta e adapta manualmente ao cadastrar um novo projeto (como o Bíblia 3D) na plataforma.

A ideia é simples: em vez de começar do zero toda vez que um projeto novo nasce, o Gestor copia as missões relevantes daqui, ajusta o que for específico do cliente, remove o que não se aplica, e cadastra o resultado na plataforma como missões reais do projeto.

Cada missão abaixo segue a estrutura definida no `01 - Visão.md`: objetivo, entrega, critério de avaliação e dependências — mais três campos úteis para planejamento: tempo estimado, vagas sugeridas e competências desenvolvidas.

---

## 1. Etapa: Descoberta

### Preparar roteiro de entrevista
- **Objetivo:** organizar as perguntas certas antes de falar com o cliente, para não desperdiçar a conversa.
- **Entrega:** roteiro de entrevista (documento com perguntas abertas sobre problema, contexto e restrições).
- **Critério de avaliação:** o roteiro cobre problema, público-alvo, restrições de prazo/orçamento e expectativas de resultado.
- **Dependências:** nenhuma.
- **Tempo estimado:** 2h.
- **Vagas sugeridas:** 1–2.
- **Competências desenvolvidas:** entrevista, levantamento de requisitos.

### Entrevistar cliente
- **Objetivo:** entender o problema real por trás da demanda do cliente.
- **Entrega:** anotações ou gravação da entrevista.
- **Critério de avaliação:** as perguntas do roteiro foram respondidas; dúvidas relevantes foram levantadas durante a conversa.
- **Dependências:** Preparar roteiro de entrevista.
- **Tempo estimado:** 1h.
- **Vagas sugeridas:** 2.
- **Competências desenvolvidas:** comunicação, escuta ativa.

### Organizar documentos e anotações
- **Objetivo:** transformar a conversa bruta em informação utilizável pelo restante da equipe.
- **Entrega:** documento organizado com os principais pontos da entrevista.
- **Critério de avaliação:** clareza e organização; alguém que não participou da entrevista consegue entender o essencial.
- **Dependências:** Entrevistar cliente.
- **Tempo estimado:** 1h30.
- **Vagas sugeridas:** 1.
- **Competências desenvolvidas:** síntese, documentação.

### Levantar dúvidas em aberto
- **Objetivo:** identificar o que ainda não está claro antes de avançar para o PRD.
- **Entrega:** lista de perguntas pendentes (pode gerar uma segunda rodada com o cliente).
- **Critério de avaliação:** as dúvidas listadas são relevantes para o escopo do projeto, não triviais.
- **Dependências:** Organizar documentos e anotações.
- **Tempo estimado:** 1h.
- **Vagas sugeridas:** 1–2.
- **Competências desenvolvidas:** pensamento crítico.

---

## 2. Etapa: PRD

### Definir objetivo do projeto
- **Objetivo:** declarar, em poucas frases, o que o projeto precisa alcançar.
- **Entrega:** parágrafo de objetivo, validado com o Gestor.
- **Critério de avaliação:** o objetivo é específico o suficiente para orientar decisões futuras (não é genérico demais).
- **Dependências:** Organizar documentos e anotações.
- **Tempo estimado:** 1h.
- **Vagas sugeridas:** 1.
- **Competências desenvolvidas:** definição de produto.

### Criar personas
- **Objetivo:** entender quem vai usar a solução.
- **Entrega:** 1 a 3 personas com necessidades e contexto de uso.
- **Critério de avaliação:** personas refletem informações reais coletadas na entrevista, não suposições genéricas.
- **Dependências:** Definir objetivo do projeto.
- **Tempo estimado:** 2h.
- **Vagas sugeridas:** 1–2.
- **Competências desenvolvidas:** design centrado no usuário.

### Listar funcionalidades
- **Objetivo:** traduzir o problema do cliente em uma lista concreta do que o sistema fará.
- **Entrega:** lista de funcionalidades, priorizadas (essencial / desejável / futuro).
- **Critério de avaliação:** cada funcionalidade está associada a uma necessidade real identificada nas personas ou na entrevista.
- **Dependências:** Criar personas.
- **Tempo estimado:** 2h.
- **Vagas sugeridas:** 2.
- **Competências desenvolvidas:** priorização, escopo.

### Definir requisitos e restrições
- **Objetivo:** registrar limites técnicos, de prazo ou de contexto que vão afetar o desenvolvimento.
- **Entrega:** lista de requisitos não-funcionais (prazo, tecnologia obrigatória, integrações necessárias, restrições do cliente).
- **Critério de avaliação:** requisitos são verificáveis, não vagos.
- **Dependências:** Listar funcionalidades.
- **Tempo estimado:** 1h.
- **Vagas sugeridas:** 1.
- **Competências desenvolvidas:** análise técnica.

---

## 3. Etapa: Planejamento

### Dividir funcionalidades em tarefas
- **Objetivo:** quebrar cada funcionalidade do PRD em unidades de trabalho executáveis.
- **Entrega:** lista de tarefas técnicas, agrupadas por funcionalidade.
- **Critério de avaliação:** cada tarefa é pequena o suficiente para ser concluída por um aluno em poucos dias.
- **Dependências:** Definir requisitos e restrições.
- **Tempo estimado:** 2h.
- **Vagas sugeridas:** 1–2.
- **Competências desenvolvidas:** planejamento técnico.

### Desenhar arquitetura inicial
- **Objetivo:** decidir a estrutura técnica geral antes de começar a desenvolver.
- **Entrega:** diagrama simples (banco de dados, principais telas/rotas, integrações).
- **Critério de avaliação:** a arquitetura cobre todas as funcionalidades essenciais listadas no PRD.
- **Dependências:** Dividir funcionalidades em tarefas.
- **Tempo estimado:** 3h.
- **Vagas sugeridas:** 1–2.
- **Competências desenvolvidas:** arquitetura de software.

### Priorizar ordem de desenvolvimento
- **Objetivo:** decidir o que será construído primeiro.
- **Entrega:** lista de tarefas ordenada, com dependências técnicas identificadas.
- **Critério de avaliação:** a ordem respeita dependências reais (ex: banco antes de tela que depende dele).
- **Dependências:** Desenhar arquitetura inicial.
- **Tempo estimado:** 1h.
- **Vagas sugeridas:** 1.
- **Competências desenvolvidas:** gestão de prioridades.

---

## 4. Etapa: Desenvolvimento

> As missões desta etapa variam mais de projeto para projeto do que as anteriores. As listadas abaixo são exemplos recorrentes — o Gestor deve ajustar de acordo com a arquitetura definida no Planejamento.

### Criar banco de dados
- **Objetivo:** implementar a estrutura de dados definida na arquitetura.
- **Entrega:** banco criado e populado com dados de teste.
- **Critério de avaliação:** estrutura corresponde ao diagrama de arquitetura; suporta as funcionalidades essenciais.
- **Dependências:** Priorizar ordem de desenvolvimento.
- **Tempo estimado:** 3h.
- **Vagas sugeridas:** 1–2.
- **Competências desenvolvidas:** modelagem de dados.

### Desenvolver funcionalidade principal (backend)
- **Objetivo:** implementar a lógica central do sistema.
- **Entrega:** funcionalidade funcionando, testável isoladamente.
- **Critério de avaliação:** atende ao critério de aceite descrito na tarefa correspondente do Planejamento.
- **Dependências:** Criar banco de dados.
- **Tempo estimado:** variável (definir por projeto).
- **Vagas sugeridas:** 1–3.
- **Competências desenvolvidas:** desenvolvimento backend.

### Desenvolver interface (frontend)
- **Objetivo:** construir a tela que permite o uso da funcionalidade.
- **Entrega:** tela funcional, conectada ao backend.
- **Critério de avaliação:** interface é usável e reflete o que foi definido nas personas/funcionalidades.
- **Dependências:** Desenvolver funcionalidade principal (backend).
- **Tempo estimado:** variável (definir por projeto).
- **Vagas sugeridas:** 1–3.
- **Competências desenvolvidas:** desenvolvimento frontend.

---

## 5. Etapa: Testes

### Testar funcionalidades principais
- **Objetivo:** verificar se o que foi desenvolvido atende ao que foi planejado.
- **Entrega:** relatório de testes (o que funciona, o que não funciona, bugs encontrados).
- **Critério de avaliação:** todas as funcionalidades essenciais do PRD foram testadas, não apenas as mais simples.
- **Dependências:** conclusão das missões de Desenvolvimento relevantes.
- **Tempo estimado:** 2h.
- **Vagas sugeridas:** 1–2.
- **Competências desenvolvidas:** teste de software, atenção a detalhes.

### Corrigir problemas encontrados
- **Objetivo:** resolver os bugs identificados nos testes.
- **Entrega:** correções aplicadas e re-testadas.
- **Critério de avaliação:** os problemas listados no relatório de testes foram resolvidos ou justificadamente adiados.
- **Dependências:** Testar funcionalidades principais.
- **Tempo estimado:** variável.
- **Vagas sugeridas:** 1–2.
- **Competências desenvolvidas:** depuração (debugging).

---

## 6. Etapa: Entrega

### Preparar entrega para o cliente
- **Objetivo:** organizar o que será apresentado ao cliente.
- **Entrega:** material de apresentação (pode ser documento, vídeo, ou o próprio sistema pronto para demonstração).
- **Critério de avaliação:** cobre as funcionalidades essenciais do PRD; está claro para alguém de fora do projeto entender o que foi feito.
- **Dependências:** Corrigir problemas encontrados.
- **Tempo estimado:** 2h.
- **Vagas sugeridas:** 1–2.
- **Competências desenvolvidas:** comunicação, apresentação.

### Apresentar e formalizar entrega
- **Objetivo:** entregar oficialmente o projeto ao cliente.
- **Entrega:** confirmação do cliente de que recebeu o projeto (formato ainda não padronizado — ver ponto em aberto no `02 - Método da Empresa Júnior.md`).
- **Critério de avaliação:** cliente confirma recebimento e entendimento do que foi entregue.
- **Dependências:** Preparar entrega para o cliente.
- **Tempo estimado:** 1h.
- **Vagas sugeridas:** 1–2.
- **Competências desenvolvidas:** encerramento de projeto.

---

## 7. Como usar este template

1. Ao cadastrar um novo projeto real (ex: Bíblia 3D), o Gestor percorre este documento etapa por etapa.
2. Para cada missão, decide: mantém como está, adapta o texto ao contexto do cliente, ou remove (se não se aplica).
3. Missões da etapa Desenvolvimento quase sempre precisam ser reescritas — elas são as mais específicas de cada projeto.
4. O resultado desse processo manual é cadastrado diretamente na plataforma como as missões reais do projeto, já com dependências e vagas ajustadas.

Este documento pode e deve ganhar novas missões com o tempo, conforme mais projetos passarem pela Empresa Júnior e revelarem padrões que ainda não estão aqui.
