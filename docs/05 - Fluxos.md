# Fluxos
## Casos de uso e jornada por papel

Versão 0.1 — Julho de 2026

---

## 0. Sobre este documento

Este documento descreve os fluxos completos do sistema — o que cada papel faz, passo a passo, e o que o sistema verifica em cada decisão. Ele serve tanto como caso de uso (a lógica interna) quanto como jornada do usuário (a experiência por papel), porque as duas coisas descrevem a mesma sequência de eventos por ângulos diferentes — separá-las em dois documentos duplicaria conteúdo sem reduzir ambiguidade nova.

Quando este documento estiver estável, os wireframes (`06 - Wireframes.md`) derivam diretamente dele: cada decisão do fluxo vira uma tela ou um estado de tela.

---

## 1. Jornada do Professor

```
Entrar
  ↓
Criar Projeto (nome, descrição, cliente)
  ↓
Criar Etapas (nome, ordem)
  ↓
Criar Missões dentro de cada etapa
  (título, tipo, objetivo, entrega esperada, critério de avaliação,
   prazo, vagas, obrigatória?, limite de reenvios, dependências, anexos)
  ↓
Projeto fica visível para os alunos
  ↓
Acompanha o dashboard (quem participa do quê, atrasos, progresso)
  ↓
Recebe entregas para avaliação
  ↓
Avalia: aprova / aprova com ressalvas / rejeita
  ↓
Marca missão como concluída (quando julgar suficiente)
  ↓
Repete até o projeto terminar
  ↓
Encerra o projeto
```

### Caso de uso: Professor cria uma Missão

1. Professor está na tela de uma Etapa.
2. Preenche os campos obrigatórios da missão (título, tipo, objetivo, entrega, critério de avaliação, vagas).
3. Sistema verifica: todos os campos obrigatórios foram preenchidos?
   - Não → bloqueia salvar, mostra o que falta.
   - Sim → segue.
4. Professor define dependências (opcional): escolhe outras missões já existentes no projeto.
5. Sistema verifica: a dependência escolhida criaria um ciclo (missão A depende de B que depende de A)?
   - Sim → bloqueia, avisa o professor.
   - Não → segue.
6. Missão é criada. Status calculado automaticamente (ver `04 - Modelo Conceitual.md`, seção 5): disponível se não há dependências, bloqueada se há.

### Caso de uso: Professor avalia uma Entrega

1. Professor abre uma Entrega pendente (status da Participação = "em aprovação").
2. Escolhe: aprovar / aprovar com ressalvas / rejeitar.
3. Se rejeitar → sistema exige feedback (campo obrigatório).
4. Sistema verifica, em caso de rejeição: a Participação já atingiu o limite de reenvios da missão?
   - Sim → Participação fica sinalizada para intervenção manual do professor (não gera nova tentativa automaticamente).
   - Não → status da Participação volta para "em andamento", aluno pode reenviar.
5. Se aprovar ou aprovar com ressalvas → status da Participação vira "concluída".
6. Professor decide, à parte, se isso é suficiente para marcar a Missão inteira como concluída (relevante quando há mais de uma vaga).

---

## 2. Jornada do Aluno

```
Entrar / se registrar
  ↓
Completar Etapa 0 (onboarding)
  ↓
Ver o mapa do projeto (missões disponíveis, bloqueadas, em andamento, concluídas)
  ↓
Escolher uma missão disponível
  ↓
Participar (se houver vaga)
  ↓
Executar o trabalho
  ↓
Entregar
  ↓
Aguardar avaliação
  ↓
Receber resultado:
  - Aprovado / aprovado com ressalvas → missão concluída para ele, mapa atualiza
  - Rejeitado → vê o feedback, reenvia (se dentro do limite)
  ↓
Nova missão desbloqueada aparece no mapa
```

### Caso de uso: Aluno participa de uma Missão

1. Aluno vê uma missão com status "disponível" no mapa.
2. Abre a missão, vê objetivo, entrega esperada, critério de avaliação, prazo, anexos.
3. Clica em "participar".
4. Sistema verifica: ainda há vaga disponível?
   - Não → bloqueia, avisa que as vagas se esgotaram.
   - Sim → segue.
5. Sistema verifica: o aluno já tem uma Participação ativa nessa mesma missão?
   - Sim → bloqueia (não permite duplicar).
   - Não → cria a Participação, status "em andamento".
6. Participação passa a existir com status "em andamento". No mapa do próprio aluno, a missão aparece como "em andamento" — mas isso reflete o status da sua Participação, não um estado global da Missão. Para outro aluno sem participação, a mesma missão pode continuar "disponível" (se ainda houver vaga) ou já não ter mais vaga, dependendo de quantos participantes ela já tem.

### Caso de uso: Aluno entrega uma atividade

1. Aluno está com uma Participação em status "em andamento".
2. Preenche o conteúdo da entrega (texto, link ou arquivo).
3. Sistema verifica: o limite de reenvios da missão já foi atingido?
   - Sim → bloqueia novo envio, mostra aviso de que precisa de intervenção do professor.
   - Não → segue.
4. Entrega é registrada; status da Participação muda para "em aprovação".
5. Aluno aguarda — sem novas ações possíveis até o professor avaliar.

---

## 2.1 Casos de uso: Atribuição de professores e alunos

### Caso de uso: Proprietário adiciona um colaborador ao Projeto

1. Proprietário está na tela de gestão de professores do projeto.
2. Busca um usuário com papel = 'professor' e o adiciona.
3. Sistema verifica: quem está fazendo essa ação é o proprietário do projeto?
   - Não → bloqueia (mesmo um colaborador não pode adicionar outro professor).
   - Sim → segue.
4. Cria a linha em ProjetoProfessor com papel_no_projeto = 'colaborador'.
5. A partir daí, o novo professor tem exatamente as mesmas permissões de escrita no projeto 
   (etapas, missões, avaliações) que o proprietário.

### Caso de uso: Professor atribui um aluno ao Projeto

1. Qualquer professor vinculado ao projeto (proprietário ou colaborador) busca um usuário 
   com papel = 'aluno' e o atribui.
2. Cria a linha em ProjetoAluno com status = 'convidado'.
3. O aluno passa a ver o projeto (nome, descrição) na sua lista, marcado como convite 
   pendente — mas ainda não vê etapas/missões.

### Caso de uso: Aluno aceita ou recusa um convite

1. Aluno abre um convite pendente.
2. Escolhe aceitar ou recusar.
3. Sistema verifica: o status atual é 'convidado'?
   - Não → bloqueia (não é possível responder um convite já respondido).
   - Sim → segue.
4. Se aceitar: status vira 'aceito', respondido_em preenchido. Aluno passa a ver etapas e 
   missões do projeto, e pode participar delas.
5. Se recusar: status vira 'recusado', respondido_em preenchido. Aluno não vê mais o 
   conteúdo do projeto (só que ele existiu e foi recusado, se quiser checar depois).

### Caso de uso: Aluno sai de um Projeto

1. Aluno com status 'aceito' aciona "Sair do projeto".
2. Sistema verifica: o status atual é 'aceito'?
   - Não → bloqueia.
   - Sim → segue.
3. Status vira 'saiu'. Aluno perde acesso a criar novas Participações ou Entregas nesse 
   projeto. Participações e Entregas já existentes permanecem visíveis para o professor, 
   como histórico.

### Caso de uso: Professor remove um aluno do Projeto

1. Professor vinculado ao projeto aciona "Remover" na lista de alunos.
2. Sistema verifica: o aluno tem status 'aceito'?
   - Não → bloqueia (não faz sentido remover quem nunca aceitou ou já saiu).
   - Sim → segue.
3. Status vira 'removido'. Mesma consequência de "sair": sem novas ações, histórico preservado.

### Caso de uso: Aluno aceita o termo específico do Projeto

1. Aluno com convite aceito tenta participar de uma missão do projeto pela primeira vez.
2. Sistema verifica: o Projeto tem `termo_especifico` definido?
   - Não → segue normalmente, nenhum passo extra.
   - Sim → verifica se `termo_aceito_em` já está preenchido para esse aluno naquele projeto.
     - Já aceito → segue normalmente.
     - Ainda não aceito → mostra o texto do termo e exige aceite explícito antes de 
       prosseguir; ao aceitar, preenche `termo_aceito_em` e só então permite criar 
       a Participação.
3. Aceitar o convite do projeto e aceitar o termo específico são ações distintas — o 
   aluno pode ver do que se trata o projeto sem precisar concordar de imediato com as 
   condições específicas dele.

---

## 3. Estados visuais no mapa do aluno (derivados do Modelo Conceitual)

Importante: os estados abaixo descrevem o que **um aluno específico** vê para uma missão — combinando o status da Missão (calculado, global) com o status da sua própria Participação (se houver). Duas pessoas podem ver estados diferentes para a mesma missão ao mesmo tempo (ex: João já participando e "em andamento", enquanto Ana ainda vê "disponível" porque há vaga sobrando).

| Situação | O que o aluno vê |
|---|---|
| Dependência da Missão não concluída | 🔒 Bloqueada |
| Dependências concluídas, aluno sem Participação, há vaga | 🟢 Disponível |
| Aluno tem Participação, sem entrega ainda | 🟡 Em andamento (para ele) |
| Aluno tem Entrega enviada, aguardando professor | 🟠 Em aprovação (para ele) |
| Professor aprovou ou aprovou com ressalvas a Participação do aluno | ✅ Concluída (para ele) |
| Professor rejeitou, dentro do limite de reenvio | 🔁 Reenviar |
| Limite de reenvio atingido | ⚠️ Aguardando professor |
| Dependências concluídas, aluno sem Participação, sem vaga sobrando | 🚫 Vagas esgotadas |

---

## 4. O que este documento não cobre

- Fluxo de login/cadastro em si (autenticação é considerada infraestrutura padrão, detalhada no `08 - API.md`, ainda não escrito).
- Fluxo do Gestor fora da plataforma (entrevista com cliente, escrita do PRD) — isso está no `02 - Método da Empresa Júnior.md`, não é fluxo de sistema.