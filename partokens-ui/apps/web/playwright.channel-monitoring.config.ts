import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'channel-monitoring.spec.ts',
  outputDir: '/tmp/partokens-channel-monitoring/playwright',
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5181', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'PARTOKENS_ADMIN_API_TARGET=http://127.0.0.1:8091 PARTOKENS_API_TARGET=http://127.0.0.1:8091 bun run dev -- --host 127.0.0.1 --port 5181', url: 'http://127.0.0.1:5181/zh-CN/', reuseExistingServer: true },
    { command: 'PYTHONPATH=. PARTOKENS_ADMIN_DATABASE_PATH=/tmp/partokens-channel-monitoring/bootstrap.sqlite PARTOKENS_ADMIN_ENCRYPTION_KEY_FILE=/tmp/partokens-channel-monitoring/test.key .venv/bin/python -m uvicorn route_browser_server:app --app-dir tests --host 127.0.0.1 --port 8091', cwd: '../../../partokens-admin-api', url: 'http://127.0.0.1:8091/healthz', reuseExistingServer: true },
  ],
})
