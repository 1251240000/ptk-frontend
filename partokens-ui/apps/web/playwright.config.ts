import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: '../../dogfood-output/playwright',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: '../../dogfood-output/playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev -- --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174/en/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
