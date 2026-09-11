import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: ['group-routes.spec.ts', 'local-channels.spec.ts'],
  outputDir: '/tmp/partokens-local-channels/playwright',
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5177', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'bun run dev -- --host 127.0.0.1 --port 5177', url: 'http://127.0.0.1:5177/zh-CN/', reuseExistingServer: true, timeout: 120000 },
    { command: 'PYTHONPATH=. .venv/bin/python -m uvicorn route_browser_server:app --app-dir tests --host 127.0.0.1 --port 8083', cwd: '../../../partokens-admin-api', url: 'http://127.0.0.1:8083/healthz', reuseExistingServer: true },
  ],
})
