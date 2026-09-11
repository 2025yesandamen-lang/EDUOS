import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4407",
    headless: true
  },
  webServer: {
    command: "node dist/server.cjs",
    env: {
      NODE_ENV: "production",
      PORT: "4407",
      DATABASE_URL: "",
      EDUOS_SKIP_DATABASE: "true",
      JWT_SECRET: "playwright-test-jwt-secret-123456789"
    },
    url: "http://127.0.0.1:4407/health",
    timeout: 30000,
    reuseExistingServer: false
  }
});