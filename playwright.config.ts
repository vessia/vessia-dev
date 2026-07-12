import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts/,
  // Suíte inteira roda sequencial (1 worker) contra Next dev + Supabase real
  // pela rede — sob esse regime sustentado, uma Server Action + re-render
  // ocasionalmente passa dos 5s padrão do Playwright sem que nada esteja
  // de fato quebrado (reproduzido: toda asserção que falhou por timeout
  // aqui passou de forma confiável quando o mesmo teste rodou sozinho ou
  // em lote pequeno). timeout/expect.timeout maiores dão margem sem
  // mascarar uma asserção que realmente falhe por valor errado.
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next dev -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
