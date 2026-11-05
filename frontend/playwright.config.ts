import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    // Optional: E2E_CHANNEL=chrome uses an installed Google Chrome.
    channel: process.env.E2E_CHANNEL || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: "php artisan serve --no-reload --host=127.0.0.1 --port=8000",
          cwd: "../backend",
          url: "http://127.0.0.1:8000/up",
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
        {
          command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ],
});
