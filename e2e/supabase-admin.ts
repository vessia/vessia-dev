import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Playwright roda o global-setup/teardown e os specs fora do runtime do
// Next.js, então .env.local não é carregado automaticamente — precisa ser
// lido manualmente aqui.
config({ path: path.resolve(__dirname, "../.env.local") });

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
