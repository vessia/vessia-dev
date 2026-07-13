# Projeto: Bíblia 3D
## Instância do método — primeiro projeto real da Empresa Júnior

Versão 0.1 — Julho de 2026

---

## 1. Identificação

- **Projeto:** Bíblia 3D
- **Cliente:** Fuctura Tecnologia
- **O que é:** um painel do aluno (portal/aplicativo) para o curso Bíblia 3D — um dos cursos de programação para crianças oferecidos pela Fuctura (que também tem cursos para adultos, como modalidade separada). O produto que este projeto entrega é o painel, não o curso em si; as crianças são o público final de quem vai usar o painel, não usuárias da Vessia.
- **Restrição de escopo explícita:** apesar do nome, nenhum conteúdo religioso entra no escopo deste projeto. Isso deve ser reforçado na entrevista inicial, para não haver ambiguidade com quem for entrevistado.
- **Status atual:** nada foi feito ainda. Nenhuma entrevista aconteceu. Este documento cobre apenas a etapa Descoberta — as demais etapas serão detalhadas depois que o PRD for escrito e aprovado, conforme o `02 - Método da Empresa Júnior.md`.

---

## 2. Ponto em aberto antes de publicar

Quem será a pessoa entrevistada dentro da Fuctura (o "responsável" pelo Bíblia 3D) ainda precisa ser definido por você antes que a missão de entrevista seja assumida por um aluno — a missão abaixo assume que esse responsável já foi identificado.

---

## 3. Onboarding (nota histórica — não é mais uma Etapa deste projeto)

Este documento originalmente descrevia o onboarding como uma "Etapa 0" dentro do próprio 
projeto Bíblia 3D, com 3 missões. **Isso mudou na implementação (Bloco 10, ver 
`DECISIONS.md`):** o onboarding virou um mecanismo global da plataforma (tabela própria 
`onboarding_progresso`), aplicado a qualquer aluno antes de acessar qualquer projeto — 
não pertence mais ao Bíblia 3D especificamente, e não deve ser recriado como Etapa aqui. 
As 8 etapas do projeto (seção 5) começam direto em "1. Descoberta".

---

## 4. Etapa: Descoberta

Estas são as missões do projeto propriamente dito, disponíveis assim que o projeto for 
publicado (o onboarding global já cuida de barrar quem ainda não passou por ele, antes 
de chegar aqui — não é mais uma dependência dentro deste projeto).

### Missão 1 — Estudar modelo de entrevista
- **Tipo:** Estudar.
- **Objetivo:** conhecer o roteiro-base de entrevista antes de adaptá-lo ao Bíblia 3D.
- **Entrega:** breve resumo escrito (3 a 5 pontos) do que o roteiro oficial de entrevista ensina — prova de que a leitura foi feita e compreendida.
- **Critério de avaliação:** o resumo demonstra compreensão real do roteiro (não é cópia literal do documento).
- **Dependências:** nenhuma.
- **Obrigatória:** sim.
- **Vagas:** 1–2.

### Missão 2 — Montar roteiro de entrevista do Bíblia 3D
- **Tipo:** Escrever.
- **Objetivo:** adaptar o roteiro oficial ao contexto específico do Bíblia 3D — entender o curso de programação para crianças (faixa etária, formato de ensino) o suficiente para desenhar o painel do aluno que vai apoiá-lo.
- **Entrega:** roteiro adaptado (perguntas sobre o problema que o painel do aluno precisa resolver, faixa etária das crianças que usarão o painel, formato de ensino do curso que o painel precisa refletir, e confirmação explícita de que o escopo é só programação, sem conteúdo religioso).
- **Critério de avaliação:** o roteiro cobre objetivo do curso, faixa etária, formato (presencial/remoto, duração), e inclui a pergunta de confirmação de escopo não-religioso.
- **Dependências:** Estudar modelo de entrevista.
- **Obrigatória:** sim.
- **Prazo:** a definir por você ao publicar.
- **Vagas:** 1–2.

### Missão 3 — Entrevistar responsável pelo Bíblia 3D
- **Tipo:** Entrevistar.
- **Objetivo:** entender, com quem conhece o projeto na Fuctura, o que o painel do aluno precisa ser para apoiar o curso Bíblia 3D.
- **Entrega:** anotações ou gravação da entrevista.
- **Critério de avaliação:** todas as perguntas do roteiro foram respondidas; ficou claro o que o curso deve ensinar e para qual faixa etária.
- **Dependências:** Montar roteiro de entrevista do Bíblia 3D.
- **Obrigatória:** sim.
- **Prazo:** a definir.
- **Vagas:** 2.

### Missão 4 — Organizar documentos e anotações
- **Tipo:** Escrever.
- **Objetivo:** transformar a conversa em informação organizada, utilizável pelo resto do projeto.
- **Entrega:** documento organizado com os principais pontos levantados na entrevista.
- **Critério de avaliação:** alguém que não participou da entrevista consegue entender, só lendo o documento, o que é o Bíblia 3D.
- **Dependências:** Entrevistar responsável pelo Bíblia 3D.
- **Obrigatória:** sim.
- **Prazo:** a definir.
- **Vagas:** 1.

### Missão 5 — Levantar dúvidas em aberto
- **Tipo:** Revisar.
- **Objetivo:** identificar o que ainda não ficou claro antes de começar o PRD.
- **Entrega:** lista de perguntas pendentes (pode virar uma segunda conversa com o responsável).
- **Critério de avaliação:** as dúvidas são relevantes para decidir o escopo do curso — não triviais.
- **Dependências:** Organizar documentos e anotações.
- **Obrigatória:** sim.
- **Prazo:** a definir.
- **Vagas:** 1–2.

---

## 5. Etapas do projeto (visão geral)

```
1. Descoberta               — entender o problema antes de pensar na solução
2. Planejamento do Produto  — transformar as informações em um plano
3. Design                   — planejar como o sistema será construído
4. Desenvolvimento          — construir o sistema
5. Testes                   — garantir que tudo funciona
6. Homologação               — confirmar que o cliente aprovou
7. Deploy                   — publicar o sistema
8. Encerramento              — finalizar o projeto e registrar o aprendizado
```

Só as Etapas 1 e 2 têm missões detalhadas agora. As Etapas 3 a 8 existem como estrutura 
(nome, ordem, entrega esperada) mas suas missões só serão definidas depois que o PRD 
(Etapa 2) estiver aprovado — definir "Backend", "Frontend" ou missões técnicas específicas 
antes disso presumiria uma arquitetura que ainda não foi confirmada com o cliente.

---

## 6. Etapa: Planejamento do Produto

Disponível depois que a Etapa 1 (Descoberta) for concluída.

### Missão 6 — Escrever objetivo do PRD
- **Tipo:** Escrever.
- **Objetivo:** declarar, em poucas frases, o que o painel do aluno precisa alcançar.
- **Entrega:** parágrafo de objetivo do PRD, validado com o professor.
- **Critério de avaliação:** o objetivo é específico o suficiente para orientar decisões 
  de design e desenvolvimento futuras — não é genérico demais.
- **Dependências:** Levantar dúvidas em aberto (Etapa 1).
- **Obrigatória:** sim.
- **Vagas:** 1.

### Missão 7 — Listar funcionalidades do painel
- **Tipo:** Escrever.
- **Objetivo:** traduzir o que foi levantado na entrevista em uma lista concreta do que 
  o painel do aluno vai ter.
- **Entrega:** lista de funcionalidades, priorizadas (essencial / desejável / futuro).
- **Critério de avaliação:** cada funcionalidade está associada a uma necessidade real 
  identificada na entrevista, não a uma suposição.
- **Dependências:** Escrever objetivo do PRD.
- **Obrigatória:** sim.
- **Vagas:** 1-2.

### Missão 8 — Definir escopo e prioridades
- **Tipo:** Revisar.
- **Objetivo:** decidir o que entra na primeira versão do painel e o que fica para depois.
- **Entrega:** documento de escopo, com prioridades claras entre as funcionalidades 
  listadas.
- **Critério de avaliação:** o escopo é realista para o tempo disponível do projeto; 
  prioridades têm justificativa, não são arbitrárias.
- **Dependências:** Listar funcionalidades do painel.
- **Obrigatória:** sim.
- **Vagas:** 1.

### Missão 9 — PRD aprovado
- **Tipo:** Apresentar.
- **Objetivo:** consolidar objetivo, funcionalidades e escopo em um único documento e 
  obter aprovação do professor antes de avançar para Design.
- **Entrega:** PRD completo, aprovado.
- **Critério de avaliação:** o professor confirma que o PRD está completo o suficiente 
  para orientar a etapa de Design sem ambiguidade.
- **Dependências:** Definir escopo e prioridades.
- **Obrigatória:** sim.
- **Vagas:** 1.

---

## 7. Etapas seguintes (Design, Desenvolvimento, Testes, Homologação, Deploy, Encerramento)

Ainda não detalhadas. Segundo o método, elas nascem depois que o PRD (Etapa 2) for aprovado — não faz sentido definir missões de Design ou Desenvolvimento antes de saber, com o PRD em mãos, o que o painel do aluno precisa ser tecnicamente. Quando a Etapa 2 estiver concluída e aprovada, este documento é atualizado com as missões da Etapa 3 (Design).

Entrega esperada de cada etapa, para referência (sem missões definidas ainda):
- **Design:** projeto técnico (fluxos, wireframes, banco, arquitetura).
- **Desenvolvimento:** sistema funcional.
- **Testes:** versão pronta, validada.
- **Homologação:** aceite do cliente (demonstração, feedback, ajustes finais).
- **Deploy:** sistema online em produção.
- **Encerramento:** projeto encerrado, com documentação e lições aprendidas registradas.

---

## 8. O que falta para publicar e apresentar aos alunos

1. Você (ou quem for o Gestor no momento) define quem é o "responsável" a ser entrevistado.
2. Cadastra o projeto Bíblia 3D na plataforma com a Etapa 1 (Descoberta, 5 missões) e a Etapa 2 (Planejamento do Produto, 4 missões) — as Etapas 3 a 8 podem ser criadas já com nome e ordem, mesmo sem missões ainda. Não recriar onboarding aqui — isso já é global.
3. Define os prazos reais (hoje marcados como "a definir").
4. Apresenta aos alunos: eles fazem login, se registram, completam o onboarding global (uma vez só, vale pra qualquer projeto) e veem a Missão 1 do Bíblia 3D disponível (as demais aparecem bloqueadas, com cadeado).