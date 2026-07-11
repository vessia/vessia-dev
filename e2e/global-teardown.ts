import fs from "node:fs";
import path from "node:path";
import { supabaseAdmin } from "./supabase-admin";

const STATE_PATH = path.resolve(__dirname, ".auth/state.json");

export default async function globalTeardown() {
  if (!fs.existsSync(STATE_PATH)) return;

  const { professor, aluno } = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));

  for (const usuario of [professor, aluno]) {
    if (!usuario?.id) continue;

    // Apaga projetos criados por esse usuário — cascateia etapas, missões,
    // dependências, participações, entregas e avaliações (ON DELETE CASCADE
    // no schema).
    await supabaseAdmin.from("projetos").delete().eq("criado_por", usuario.id);

    // Apaga o usuário de auth — cascateia para profiles.
    await supabaseAdmin.auth.admin.deleteUser(usuario.id);
  }

  fs.rmSync(STATE_PATH, { force: true });
}
