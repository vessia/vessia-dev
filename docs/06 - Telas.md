# Telas
## Especificação + wireframe (rabisco) por tela

Versão 0.1 — Julho de 2026

---

## 0. Sobre este documento

Cada tela abaixo tem: objetivo, informações exibidas, ações possíveis, condições de habilitar/desabilitar, e um rabisco em caixas de texto. Nenhuma decisão de estética (cor, fonte, espaçamento) entra aqui — isso é responsabilidade da implementação, não do produto. O que importa aqui é: quais informações aparecem, o que é clicável, e por quê.

---

## 1. Login / Cadastro

**Objetivo:** autenticar o usuário e distingui-lo como Professor ou Aluno.

**Campos:** e-mail, senha (e, no cadastro, nome e papel).

**Ações:** entrar, criar conta, recuperar senha.

**Validações:** e-mail já cadastrado bloqueia novo cadastro com o mesmo e-mail; senha com requisito mínimo padrão.

```
┌────────────────────────────┐
│   Empresa Júnior            │
│                              │
│   [ e-mail            ]     │
│   [ senha             ]     │
│                              │
│   [   Entrar   ]            │
│                              │
│   Criar conta · Esqueci a senha │
└────────────────────────────┘
```

---

## 2. Onboarding (Etapa 0)

**Objetivo:** apresentar a mecânica da plataforma antes do primeiro projeto real.

**Informações exibidas:** as 3 missões de onboarding (ver `03 - Projeto Bíblia 3D.md`), cada uma com botão de "marcar como concluído" (autoavaliação, sem aprovação do professor).

**Ações:** marcar cada item como lido/concluído.

**Condição de avanço:** só acessa o mapa do projeto depois de concluir as 3 missões de onboarding.

```
┌────────────────────────────┐
│  Bem-vindo à Vessia          │
│                              │
│  ✅ Conheça a Vessia         │
│  🟢 Como funcionam as missões [marcar]│
│  🔒 Como funciona a aprovação│
│                              │
│         [ Continuar ]       │
└────────────────────────────┘
```

---

## 3. Mapa do Projeto (visão do Aluno)

**Objetivo:** o aluno sabe, de relance, onde o projeto está e o que ele pode fazer agora.

**Informações exibidas:** nome do projeto, progresso por etapa (%), lista de missões agrupadas por etapa, com ícone de tipo, estado (🔒🟢🟡🟠✅🔁⚠️🚫 — ver `05 - Fluxos.md` seção 3), vagas restantes.

**Ações:** clicar em uma missão disponível ou em andamento abre o detalhe dela. Missões bloqueadas ou com vagas esgotadas não são clicáveis (ou abrem em modo somente leitura, mostrando o motivo).

```
┌────────────────────────────┐
│  Projeto: Bíblia 3D          │
│                              │
│  Descoberta   ██████░░ 60%  │
│   🟢 📖 Estudar modelo entrevista │
│   🔒 ✍️ Montar roteiro       │
│   🔒 🎤 Entrevistar          │
│   🔒 ✍️ Organizar documentos │
│   🔒 🔍 Levantar dúvidas     │
│                              │
│  PRD          Bloqueado     │
└────────────────────────────┘
```

---

## 4. Detalhe da Missão (visão do Aluno)

**Objetivo:** o aluno entende o que precisa fazer e consegue agir (participar ou entregar).

**Informações exibidas:** título, tipo, objetivo, entrega esperada, critério de avaliação, prazo, vagas (X de Y preenchidas), anexos de apoio, dependências (com indicação se estão concluídas).

**Ações:**
- Se disponível e com vaga → botão "Participar".
- Se o aluno já participa e ainda não entregou → campo de entrega + botão "Enviar".
- Se rejeitada e dentro do limite de reenvio → mostra feedback do professor + botão "Reenviar".
- Se limite de reenvio atingido → mensagem de que a situação está com o professor, sem ação disponível.

```
┌────────────────────────────┐
│ 🎤 Entrevistar responsável   │
│                              │
│ Objetivo: entender o que... │
│ Entrega: anotações da...    │
│ Critério: perguntas do...   │
│ Vagas: 1 de 2 preenchidas   │
│ Prazo: 15/07                │
│                              │
│        [ Participar ]       │
└────────────────────────────┘
```

---

## 5. Envio de Entrega (visão do Aluno)

**Objetivo:** registrar o trabalho produzido.

**Informações exibidas:** o que a missão espera como entrega (repete o critério), número da tentativa atual (ex: "2ª tentativa de 3").

**Campos:** texto, link, ou upload de arquivo (conforme o tipo de missão).

**Ações:** enviar.

**Validação:** não permite enviar sem preencher ao menos um dos campos de conteúdo.

```
┌────────────────────────────┐
│ Entregar: Entrevistar...    │
│  (2ª tentativa de 3)        │
│                              │
│ [  texto / link / arquivo ] │
│                              │
│         [ Enviar ]          │
└────────────────────────────┘
```

---

## 6. Dashboard do Professor

**Objetivo:** visão geral do projeto sem precisar abrir cada missão individualmente.

**Informações exibidas:** lista de projetos ativos, progresso por etapa, lista de entregas pendentes de avaliação, missões atrasadas (prazo estourado sem entrega aprovada), quem está participando de quê.

**Ações:** clicar em uma entrega pendente abre a tela de avaliação; clicar em um aluno mostra suas participações.

```
┌────────────────────────────┐
│ Projeto: Bíblia 3D           │
│  Descoberta ██████░░ 60%    │
│                              │
│ Pendências de avaliação (2) │
│  · João — Entrevistar resp. │
│  · Ana — Montar roteiro     │
│                              │
│ Atrasadas (1)                │
│  · Pedro — Organizar docs   │
└────────────────────────────┘
```

---

## 7. Avaliação de Entrega (visão do Professor)

**Objetivo:** decidir sobre uma entrega específica.

**Informações exibidas:** conteúdo da entrega, critério de avaliação da missão (lado a lado, pra facilitar o julgamento), histórico de tentativas anteriores (se houver).

**Ações:** aprovar / aprovar com ressalvas / rejeitar. Campo de feedback (obrigatório se rejeitar).

```
┌────────────────────────────┐
│ Avaliar: João — Entrevistar │
│                              │
│ Critério: perguntas do...   │
│ Entrega: [conteúdo enviado] │
│                              │
│ Feedback: [            ]    │
│                              │
│ [Aprovar] [Ressalvas] [Rejeitar] │
└────────────────────────────┘
```

---

## 8. Criação/Edição de Missão (visão do Professor)

**Objetivo:** cadastrar uma missão dentro de uma etapa.

**Campos:** título, tipo, objetivo, entrega esperada, critério de avaliação, prazo, vagas, obrigatória (sim/não), limite de reenvios, dependências (seleção entre missões já existentes no projeto), anexos.

**Validação:** bloqueia salvar sem os 4 elementos obrigatórios (objetivo, entrega, critério, dependências — mesmo que "nenhuma"); bloqueia dependência que criaria ciclo.

```
┌────────────────────────────┐
│ Nova Missão — Etapa PRD      │
│                              │
│ Título:     [           ]   │
│ Tipo:       [ Escrever ▾]   │
│ Objetivo:   [           ]   │
│ Entrega:    [           ]   │
│ Critério:   [           ]   │
│ Vagas:      [ 2 ]           │
│ Depende de: [ Entrevistar ▾]│
│                              │
│        [ Salvar ]           │
└────────────────────────────┘
```

---

## 9. O que este documento não cobre

- Estética visual (cores, tipografia, ícones reais) — decisão de implementação, não de produto.
- Responsividade mobile vs desktop — assume-se que ambos precisam funcionar, mas o layout exato fica com quem implementa.
