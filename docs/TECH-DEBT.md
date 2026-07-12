# Technical Debt
## Vessia

Dívidas técnicas conscientes — não são decisões de produto (não entram no `DECISIONS.md`), são notas de implementação para revisar depois que o MVP estiver rodando.

---

### `papel` como enum fixo (Professor / Aluno)
Funciona para o MVP. Se surgirem outros papéis reais (Mentor, Coordenador, Administrador, Observador), substituir por um sistema de permissões em vez de continuar adicionando valores ao enum.

### RLS (Row Level Security) é um esboço mínimo
As policies em `001_initial_schema.sql` cobrem o caso feliz. Revisar durante a implementação — não é documento de produto, pode mudar livremente.

### Dependência circular entre missões não é bloqueada pelo banco
Precisa ser validada na aplicação antes do insert (ver `05 - Fluxos.md`).

### Deploy: Vercel (não VPS)
Decisão de infraestrutura, não de produto. Next.js + Vercel elimina configuração de deploy (Nginx, SSL, pipeline) que competiria com tempo do Plano de Implementação. Preview deployment por branch é nativo, o que encaixa direto no fluxo `main`/`develop`. Reversível a qualquer momento — Next.js não tem lock-in de hospedagem, pode migrar pra VPS depois se fizer sentido por custo/controle.

### Rate limit de e-mail padrão do Supabase quebra testes e2e repetidos
O serviço de e-mail embutido do Supabase (sem SMTP customizado) tem cota baixa. Testes e2e de cadastro (`e2e/auth.spec.ts`) vão passar na primeira execução do dia e falhar por rate limit em execuções subsequentes próximas — não é bug do app. Configurar um provedor SMTP próprio (Auth → Settings → SMTP no painel do Supabase) resolve. Vale fazer antes que isso comece a mascarar falhas reais em blocos futuros.

### Checagem de vaga em "Participar" tem corrida (TOCTOU)
`podeParticipar()` conta participações existentes e compara com `vagas` antes do insert, mas não há lock nem constraint no banco garantindo isso — dois alunos clicando "Participar" quase ao mesmo tempo na última vaga podem ambos passar na checagem antes de qualquer um inserir. O `unique(missao_id, aluno_id)` evita duplicidade do mesmo aluno, mas não excesso de vagas por alunos diferentes. Mesma categoria de limitação já registrada para dependência circular — aceitável pro MVP (baixíssima chance de colisão real numa sala de aula), resolver com um constraint/trigger no banco se virar problema de verdade.

### Worker do Turbopack pode travar em sessões de dev muito longas
`npm run dev` rodando continuamente por muitas horas (comum durante uma sessão longa de testes) pode acumular erro tipo "Jest worker encountered N child process exceptions" até crashar. Não é bug de código — é o pool de workers do Turbopack se esgotando. Solução: parar o processo `next dev` e iniciar de novo. Se isso ficar recorrente em uso normal (não só em sessão de desenvolvimento), vale investigar se é uma versão específica do Next.js 16 com esse problema conhecido, mas por ora é só reiniciar.

### Painel de admin ainda não existe — professor é criado manualmente
Hoje há um único professor, criado direto no banco. A criação de novo projeto está temporariamente travada por feature flag (ver DECISIONS.md) enquanto isso. Vale construir um painel de admin (criar/gerenciar contas de professor, religar a criação de projeto por permissão em vez de flag global) quando existir mais de um professor sendo criado com alguma frequência — não antes.