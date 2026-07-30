import { defineConfig, devices } from '@playwright/test'

const evidenceRoot = process.env.PARTOKENS_E2E_OUTPUT_DIR || '../../dogfood-output/r60-console-staging-validation'

export default defineConfig({
  testDir: './e2e',
  outputDir: `${evidenceRoot}/playwright`,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: `${evidenceRoot}/playwright-report`, open: 'never' }]],
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
  webServer: [
    {
      command: 'bun run dev -- --host 127.0.0.1 --port 4174',
      url: 'http://127.0.0.1:4174/en/',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'bun run --cwd ../design-lab dev',
      url: 'http://127.0.0.1:4180/#console',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
