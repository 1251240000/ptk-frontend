import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'group-routes.spec.ts',
  outputDir: '../../dogfood-output/2026-09-11-group-route-inline/playwright',
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5175', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: 'bun run dev -- --host 127.0.0.1 --port 5175', url: 'http://127.0.0.1:5175/zh-CN/', reuseExistingServer: true, timeout: 120000 },
    { command: 'PYTHONPATH=. .venv/bin/python -m uvicorn route_browser_server:app --app-dir tests --host 127.0.0.1 --port 8082', cwd: '../../../partokens-admin-api', url: 'http://127.0.0.1:8082/healthz', reuseExistingServer: true },
  ],
})
