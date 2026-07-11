# Método da Empresa Júnior
## Fuctura Tecnologia

Versão 0.1 — Julho de 2026

---

## 0. Propósito deste documento

Este documento não descreve a plataforma. Descreve **como a Empresa Júnior funciona hoje, na prática**, independentemente de qual sistema é usado para apoiar o processo. A plataforma (documento `01 - Visão.md`) é uma implementação deste método — não o contrário. Se o método mudar, a plataforma se adapta. Se o método não estiver claro, a plataforma acaba inventando um processo que não corresponde à realidade.

### Duas camadas neste documento

Existe uma diferença entre o que é genérico de qualquer projeto e o que é específico de como a Empresa Júnior opera:

- **Camada genérica** — qualquer projeto, em qualquer contexto, passa por Descoberta → PRD → Planejamento → Desenvolvimento → Testes → Entrega. Isso já está capturado no conceito de Etapa no `01 - Visão.md` e não é exclusivo da Empresa Júnior.
- **Camada específica da Empresa Júnior** — quem faz o quê nessa sequência, hoje: o Gestor recebendo cliente, entrevistando, escrevendo PRD, aprovando entregas. Isso é como a Fuctura opera, não como o software funciona.

Essa separação existe **só como organização de texto**, para que, se um dia outro contexto (curso, onboarding) usar a mesma sequência genérica com um processo operacional diferente, baste escrever um novo documento equivalente a este — sem precisar reescrever a Visão nem construir um motor de templates. Isso não muda o escopo do MVP nem adiciona nenhuma entidade nova ao modelo de dados: a plataforma continua sendo construída apenas para a Empresa Júnior.

---

## 1. Papéis do método

Neste momento, apenas dois papéis estão claramente separados. Um terceiro papel — o **Gestor** — concentra todas as funções que ainda não foram divididas. Isso é intencional e temporário: em vez de inventar uma separação de responsabilidades que não existe na prática, o método assume que o Gestor acumula funções até que haja motivo real para separá-las.

- **Gestor** — recebe o cliente, decide se um contato vira projeto, conduz a entrevista, escreve o PRD inicial, e hoje também assume o papel de Professor dentro da plataforma (cria missões, aprova entregas). Pode ser uma ou mais pessoas, mas o método não distingue essas funções entre pessoas diferentes ainda.
- **Aluno** — participa de missões dentro de um projeto já estruturado.

> Nota de mapeamento: a plataforma (`01 - Visão.md`) só tem dois papéis de login — Professor e Aluno. Até que o Gestor seja formalmente separado, as ações do Gestor descritas abaixo que acontecem *dentro* da plataforma (criar projeto, criar missões, aprovar entregas) são realizadas através do login de Professor. As ações que acontecem *antes* de existir um projeto (receber cliente, entrevistar, escrever PRD) acontecem fora da plataforma.

---

## 2. O fluxo completo

```
Cliente entra em contato
        ↓
Gestor recebe
        ↓
Gestor decide: vira projeto?
        ↓ (sim)
Gestor entrevista o cliente
        ↓
Gestor escreve o PRD inicial
        ↓
PRD é validado
        ↓
Projeto é criado na plataforma
        ↓
Gestor (como Professor) estrutura etapas e missões
        ↓
Missões ficam disponíveis para os alunos
        ↓
Alunos participam das missões
        ↓
Alunos entregam
        ↓
Gestor (como Professor) aprova, aprova com ressalvas, ou rejeita
        ↓
Missões dependentes são desbloqueadas
        ↓
(repete até a etapa Entrega)
        ↓
Projeto é encerrado e entregue ao cliente
```

---

## 3. Cada etapa do método, em detalhe

### 3.1 Cliente entra em contato
Um cliente (interno ou externo à Fuctura) chega com uma necessidade. A origem do contato ainda não é padronizada — pode ser indicação, rede de contatos da Fuctura, ou demanda interna (como o próprio caso do Bíblia 3D).

### 3.2 Gestor recebe
O Gestor é o ponto único de entrada. Não existe hoje um processo formal de triagem — é o Gestor quem decide informalmente se vale a pena seguir.

### 3.3 Gestor decide: vira projeto?
Critério de decisão ainda não formalizado. Por ora, fica a critério do Gestor avaliar se a demanda é viável para ser executada pela Empresa Júnior (tem escopo definível, cabe no calendário do curso, existe interesse de alunos). Isso é um ponto em aberto (ver seção 5).

### 3.4 Gestor entrevista o cliente
Levantamento inicial de necessidade: o que o cliente precisa, qual problema está tentando resolver, restrições (prazo, orçamento se houver, tecnologia). Não existe hoje um roteiro padronizado de entrevista — é um ponto em aberto.

### 3.5 Gestor escreve o PRD inicial
Documento com objetivo do projeto, escopo e funcionalidades principais. Serve de base para dividir o projeto em etapas e missões. Ainda não existe um formato padrão de PRD para esse contexto — outro ponto em aberto.

### 3.6 PRD é validado
Hoje, é o próprio Gestor quem valida o PRD que ele mesmo escreveu, por acumular a função. Não existe uma segunda pessoa revisando antes do projeto começar a ser estruturado.

### 3.7 Projeto é criado na plataforma
A partir do PRD validado, o Gestor (agora como Professor) cadastra o projeto na plataforma.

### 3.8 Gestor estrutura etapas e missões
As etapas seguem a sequência padrão (Descoberta → PRD → Planejamento → Desenvolvimento → Testes → Entrega). As missões dentro de cada etapa são derivadas do PRD e das necessidades específicas do projeto. É aqui que o documento `03 - Template: Desenvolvimento de Software` (próximo da fila) entra como referência — uma lista genérica de missões por etapa que acelera esse trabalho.

### 3.9 Missões ficam disponíveis
Conforme definido no `01 - Visão.md`: uma missão fica disponível quando suas dependências estão concluídas e aprovadas.

### 3.10 Alunos participam
Um aluno escolhe uma missão disponível e participa (respeitando o número de vagas).

### 3.11 Alunos entregam
O aluno registra sua entrega na plataforma.

### 3.12 Gestor aprova, aprova com ressalvas, ou rejeita
Conforme o fluxo de aprovação já definido na Visão. Se rejeitada, o aluno reenvia respeitando o limite definido por missão.

### 3.13 Missões dependentes são desbloqueadas
Automático, conforme aprovação.

### 3.14 Projeto é encerrado e entregue ao cliente
O que caracteriza "encerramento" (todas as etapas concluídas? entrega formal ao cliente? assinatura de aceite?) ainda não está definido — ponto em aberto.

---

## 4. O que este método explicitamente não resolve ainda

- Não define um processo de retrospectiva (o que funcionou, o que não funcionou, ao final do projeto).
- Não define o que acontece se um projeto for interrompido no meio (cliente desiste, demanda muda de escopo).
- Não define como o cliente acompanha o andamento do projeto (se é informado, e como).

Esses pontos ficam registrados aqui para não se perderem, mas não bloqueiam o MVP nem os próximos documentos.

---

## 5. Pontos em aberto (decisões pendentes do Gestor/Fuctura, não da plataforma)

1. Critério para decidir se uma demanda vira projeto.
2. Roteiro padrão de entrevista com cliente.
3. Formato padrão do PRD inicial.
4. Se e quando o papel de Gestor será separado em funções distintas (ex: quem entrevista ≠ quem aprova).
5. O que formalmente caracteriza o encerramento de um projeto.

Nenhum desses pontos impede a construção do MVP da plataforma — eles são decisões de processo da Empresa Júnior, não de software. Ficam registrados aqui para retomar quando fizer sentido.
