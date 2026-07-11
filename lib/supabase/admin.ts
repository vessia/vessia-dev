import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client com service_role — ignora RLS. Nunca importar em código client-side.
// Uso restrito a operações administrativas pontuais, como criar a linha em
// `profiles` logo após o signUp (antes de existir sessão, quando confirmação
// de e-mail está habilitada).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
