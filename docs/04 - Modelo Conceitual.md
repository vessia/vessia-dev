# Modelo Conceitual
## Vessia

Versão 0.1 — Julho de 2026

---

## 0. O que este documento é (e não é)

Este documento descreve as entidades do domínio, seus atributos, relacionamentos e regras de negócio. Não é um schema de banco de dados — não define tipos de coluna, chaves estrangeiras ou índices. Quando este documento estiver sólido, o banco (`06 - Schema.md`, ainda não escrito) deriva quase diretamente dele.

Toda regra de negócio aqui já foi decidida nos documentos anteriores (`01 - Visão.md`, `02 - Método da Empresa Júnior.md`). Onde uma regra ainda não tinha sido decidida, ela foi decidida agora e está marcada como **[decisão nova]**.

---

## 1. Visão geral das entidades

```
Usuário
   ↓ (papel: Professor ou Aluno)

Projeto
   ↓ possui
Etapa
   ↓ possui
Missão ←→ Missão (dependência, auto-relacionamento)
   ↓ possui
Participação (Usuário + Missão)
   ↓ possui
Entrega (pode haver mais de uma, por reenvio)
   ↓ possui
Avaliação (uma por entrega)
```

---

## 2. Usuário

**Finalidade:** representa qualquer pessoa com login na plataforma.

**Atributos:**
- nome
- e-mail
- papel (`professor` | `aluno`)

**Relacionamentos:**
- Um Usuário com papel `professor` cria Projetos, Etapas e Missões, e avalia Entregas.
- Um Usuário com papel `aluno` participa de Missões.

**Regras de negócio:**
- O papel é fixo por usuário no MVP — não existe um usuário que acumule os dois papéis simultaneamente na plataforma. Conforme o `02 - Método da Empresa Júnior.md`, o "Gestor" (papel do mundo real) opera dentro do sistema através do login de Professor.

---

## 3. Projeto

**Finalidade:** representa o trabalho completo sendo desenvolvido para um cliente. É a raiz de tudo — etapas, missões, participações existem sempre dentro de um projeto.

**Atributos:**
- nome (ex: "Bíblia 3D")
- descrição
- cliente (texto livre no MVP — ex: "Fuctura Tecnologia")
- status (`ativo` | `encerrado`)
- criado_por
- criado_em
- encerrado_por
- encerrado_em

**Relacionamentos:**
- Um Projeto possui várias Etapas.
- Um Projeto possui vários Professores vinculados (ver ProjetoProfessor, seção 3.1) — um deles é o proprietário, os demais são colaboradores.
- Um Projeto possui vários Alunos atribuídos (ver ProjetoAluno, seção 3.2).

**Regras de negócio:**
- Um projeto não pode ser marcado como `encerrado` enquanto houver missões obrigatórias sem avaliação com resultado final (aprovada ou aprovada com ressalvas).
- Quem cria o projeto vira automaticamente seu proprietário em ProjetoProfessor.
- Leitura e escrita de Etapas, Missões e Avaliações dentro de um Projeto são restritas aos professores vinculados àquele projeto (proprietário ou colaborador) — não a "qualquer professor" da plataforma.

---

## 3.1 ProjetoProfessor

**Finalidade:** vincula um ou mais professores a um Projeto, com diferenciação entre quem criou o projeto (proprietário) e quem foi convidado a colaborar.

**Atributos:**
- papel_no_projeto (`proprietario` | `colaborador`)
- adicionado_por
- adicionado_em

**Relacionamentos:**
- É uma relação N:N entre Projeto e Usuário (papel `professor`).

**Regras de negócio:**
- Todo Projeto tem exatamente um proprietário (criado junto com o Projeto).
- Um Projeto pode ter zero ou mais colaboradores.
- Só o proprietário pode adicionar ou remover outros professores do projeto.
- Colaborador tem exatamente as mesmas permissões de escrita dentro do projeto (Etapas, Missões, Avaliações) que o proprietário — a única ação exclusiva do proprietário é gerenciar quem são os professores do projeto.

---

## 3.2 ProjetoAluno

**Finalidade:** representa a atribuição de um aluno a um Projeto, controlada pelo professor — o aluno não se autoinscreve livremente.

**Atributos:**
- status (`convidado` | `aceito` | `recusado` | `saiu` | `removido`)
- atribuido_por (professor que atribuiu)
- atribuido_em
- respondido_em (quando o aluno aceitou/recusou/saiu, ou quando foi removido)

**Relacionamentos:**
- É uma relação N:N entre Projeto e Usuário (papel `aluno`).

**Regras de negócio:**
- Professor cria a atribuição com status `convidado`.
- Aluno responde: `aceito` ou `recusado`, enquanto o status for `convidado`.
- Aluno com status `aceito` pode, a qualquer momento, mudar para `saiu` (sair do projeto por conta própria).
- Professor pode, a qualquer momento que o status seja `aceito`, mudar para `removido`.
- Aluno só enxerga e participa das Missões de um Projeto enquanto seu status ali for `aceito`.
- Participações e Entregas já existentes de um aluno que saiu ou foi removido **permanecem visíveis como histórico** para o professor — não são apagadas. O aluno só perde a possibilidade de criar novas Participações ou Entregas naquele projeto.

---

## 4. Etapa

**Finalidade:** marco do projeto. Organiza missões relacionadas e serve como indicador visual de progresso.

**Atributos:**
- nome (ex: "Descoberta")
- ordem (posição dentro do projeto)

**Relacionamentos:**
- Uma Etapa pertence a um Projeto.
- Uma Etapa possui várias Missões.

**Regras de negócio:**
- Uma Etapa é considerada concluída quando todas as suas Missões obrigatórias estão concluídas (ver regra de conclusão de Missão, seção 5).
- Progresso da etapa (%) é sempre um valor calculado — proporção de missões obrigatórias concluídas sobre o total de missões obrigatórias da etapa. Não é armazenado diretamente.
- A ordem entre etapas é sequencial apenas como exibição — o bloqueio real de missões é controlado por dependência entre missões específicas (não por ordem de etapa), conforme decidido no `01 - Visão.md`.

---

## 5. Missão

**Finalidade:** menor unidade de trabalho. O que o aluno de fato executa.

**Atributos:**
- título
- descrição
- tipo (`estudar` | `entrevistar` | `escrever` | `desenvolver` | `testar` | `revisar` | `apresentar`)
- objetivo
- critério de avaliação
- prazo
- vagas (número de participações simultâneas permitidas)
- obrigatória (booleano)
- limite de reenvios
- concluída_em (data/hora — nulo até o professor marcar a missão como concluída)
- concluída_por (usuário professor que marcou)

**Relacionamentos:**
- Uma Missão pertence a uma Etapa.
- Uma Missão pode depender de outras Missões (auto-relacionamento N:N — "depende de").
- Uma Missão possui várias Participações (até o limite de vagas).
- Uma Missão pode ter vários Anexos (ver entidade Arquivo, seção 6.1).

**Regras de negócio:**
- **O status da Missão não é armazenado — é sempre calculado**, para eliminar a possibilidade de um status salvo ficar inconsistente com a realidade (ex: "disponível" salvo enquanto uma dependência ainda está pendente). A lógica de cálculo:
  1. Se `concluída_em` está preenchido → status é **concluída**.
  2. Senão, se existe alguma dependência sem `concluída_em` preenchido → status é **bloqueada**.
  3. Senão, se existe pelo menos uma Participação → status é **em andamento**.
  4. Senão → status é **disponível**.
- `concluída_em` só pode ser preenchido manualmente pelo professor (ver regra de conclusão abaixo) — nunca automaticamente, mesmo com todas as participações aprovadas.
- Se ultrapassar o prazo sem nenhuma participação com entrega aprovada, a missão fica sinalizada como atrasada — isso é um alerta de interface, não um novo status armazenado.

---

## 6. Dependência

**Finalidade:** define a ordem de desbloqueio entre missões específicas.

**Atributos:**
- missão (a que fica bloqueada)
- depende_de (a que precisa estar concluída antes)

**Relacionamentos:**
- É uma relação N:N entre Missão e ela mesma.

**Regras de negócio:**
- Uma missão pode ter zero, uma, ou várias dependências.
- Dependências circulares não são permitidas (missão A não pode depender, direta ou indiretamente, de uma missão que depende dela).

---

## 6.1 Arquivo (Anexo)

**Finalidade:** representa um arquivo ou link anexado a outra entidade. Modelado como entidade própria em vez de um campo dentro de cada uma, porque o mesmo conceito de "anexo" se repete em Projeto, Missão, Entrega e Avaliação — evita duplicar a mesma lógica quatro vezes.

**Atributos:**
- nome
- url ou referência de armazenamento
- tipo (arquivo | link)
- enviado_por
- enviado_em

**Relacionamentos:**
- Um Arquivo pertence a exatamente uma entidade "dona" (Projeto, Missão, Entrega ou Avaliação) — relação polimórfica.

**Regras de negócio:**
- No MVP, o uso concreto está limitado aos anexos de apoio em Missão (material fornecido pelo professor) e ao conteúdo de Entrega, quando for arquivo em vez de texto/link simples. Projeto e Avaliação podem usar essa mesma entidade no futuro sem redesenho.

---

## 7. Participação

**Finalidade:** representa o vínculo de um aluno específico com uma missão específica. Existe porque uma missão pode ter várias vagas, e cada aluno tem sua própria entrega e resultado — ninguém "assume" a missão inteira.

**Atributos:**
- status (`em andamento` | `em aprovação` | `concluída`)
- criada_em

**Relacionamentos:**
- Uma Participação pertence a um Usuário (aluno) e a uma Missão.
- Uma Participação possui uma ou mais Entregas (mais de uma, em caso de reenvio após rejeição).

**Regras de negócio:**
- Um aluno só pode ter uma Participação ativa por Missão (não participa da mesma missão duas vezes em paralelo).
- Uma nova participação só pode ser criada em uma Missão com status `disponível` ou `em andamento`, e apenas se ainda houver vagas livres.
- **Uma nova Participação só pode ser criada se o aluno tiver status `aceito` em ProjetoAluno para o Projeto ao qual a Missão pertence** — aluno convidado, recusado, que saiu ou foi removido não pode iniciar novas participações naquele projeto, mesmo que a missão esteja disponível.
- O número de Entregas de uma Participação não pode ultrapassar o limite de reenvios definido na Missão.

---

## 8. Entrega

**Finalidade:** o material que o aluno produziu, submetido para avaliação.

**Atributos:**
- conteúdo (texto, link, ou arquivo)
- enviada_em
- número da tentativa (1ª, 2ª, etc., dentro do limite de reenvios da missão)

**Relacionamentos:**
- Uma Entrega pertence a uma Participação.
- Uma Entrega possui exatamente uma Avaliação (depois de avaliada).

**Regras de negócio:**
- Ao ser criada, uma Entrega muda o status da Participação para `em aprovação`.
- Uma Entrega sem Avaliação ainda é a única forma de uma Participação estar `em aprovação` — não existe entrega "parcial".

---

## 9. Avaliação

**Finalidade:** registra a decisão do professor sobre uma entrega específica — o histórico de todas as decisões pedagógicas do projeto.

**Atributos:**
- resultado (`aprovada` | `aprovada com ressalvas` | `rejeitada`)
- feedback (obrigatório se `rejeitada`, opcional nos demais casos)
- avaliada_em
- avaliador (Usuário com papel `professor`)

**Relacionamentos:**
- Uma Avaliação pertence a uma Entrega.

**Regras de negócio:**
- Resultado `aprovada` ou `aprovada com ressalvas` muda o status da Participação para `concluída`.
- Resultado `rejeitada` muda o status da Participação de volta para `em andamento`, permitindo nova Entrega — respeitando o limite de reenvios da Missão.
- Ao atingir o limite de reenvios sem aprovação, a Participação fica sinalizada para intervenção manual do professor (o sistema não decide sozinho o próximo passo).

---

## 10. O que fica de fora deste modelo (propositalmente)

- **Cliente** e **Template** como entidades formais — continuam fora do MVP (ver seção 9 do `01 - Visão.md`). "Cliente" hoje é só um campo de texto dentro de Projeto.
- **Competências desenvolvidas** como campo estruturado — fica só como referência informal no `Rascunho - Template`, não entra no modelo de dados agora.
- Qualquer entidade de agrupamento entre Etapa e Missão (discutido e adiado no `01 - Visão.md`, seção 9).
- **Comentário** — comunicação sobre uma missão, entrega ou avaliação (pergunta do aluno, observação do professor) hoje acontece fora da plataforma. Entidade prevista para o futuro, não modelada agora.
- **Assistente de criação (wizard)** — não é uma entidade, é uma decisão de interface: criar projeto/etapas/missões continua sendo formulário simples no MVP. Só vale a pena automatizar quando existirem vários professores criando vários projetos com frequência.
