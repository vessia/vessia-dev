import { getOptionalUser } from "@/lib/auth/dal";
import { FeedbackWidget } from "./widget";

// Não renderiza nada pra quem não está autenticado — cobre /login,
// /cadastro e a landing pública de uma vez (nenhuma dessas rotas tem
// sessão), sem precisar checar rota nenhuma aqui. A exclusão explícita das
// 3 rotas (pro caso raro de um usuário JÁ autenticado visitar /login ou
// /cadastro) é feita dentro do próprio FeedbackWidget, via pathname.
export async function FeedbackWidgetGate() {
  const user = await getOptionalUser();
  if (!user) return null;
  return <FeedbackWidget />;
}
