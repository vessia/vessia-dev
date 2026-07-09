import { createClient } from "@/lib/supabase/server";

export default async function StatusPage() {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const ok = !error;

  return (
    <main style={{ fontFamily: "monospace", padding: "2rem" }}>
      <h1>Status da conexão Supabase</h1>
      <p>
        Resultado:{" "}
        <strong style={{ color: ok ? "green" : "crimson" }}>
          {ok ? "OK" : "FALHOU"}
        </strong>
      </p>
      {ok ? (
        <p>Query de teste (contagem de linhas em `profiles`): {count}</p>
      ) : (
        <>
          <p>A query de teste em `profiles` falhou. Erro retornado:</p>
          <pre
            style={{
              background: "#f4f4f4",
              padding: "1rem",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(error, null, 2)}
          </pre>
          <p>
            Isso é esperado se `.env.local` ainda não tiver as chaves reais
            do Supabase, ou se `001_initial_schema.sql` ainda não tiver sido
            executado no projeto.
          </p>
        </>
      )}
    </main>
  );
}
