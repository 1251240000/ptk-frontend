import { defineConfig, devices } from '@playwright/test'

const evidenceRoot = process.env.PARTOKENS_E2E_OUTPUT_DIR || '../../dogfood-output/r60-console-staging-validation'
const e2eSuites = [
  'selection-controls.spec.ts',
  'admin-model-operations.spec.ts',
  'account.spec.ts',
  'auth-visual.spec.ts',
  'console-release-readiness.spec.ts',
  'console-visual.spec.ts',
  'console.spec.ts',
  'critical-flows.spec.ts',
  'playground.spec.ts',
  'public-content.spec.ts',
  'studio.spec.ts',
] as const

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
  projects: e2eSuites.map((suite) => ({
    name: suite.replace('.spec.ts', ''),
    testMatch: suite,
    use: { ...devices['Desktop Chrome'] },
  })),
  webServer: [
    {
      command: 'bunx rsbuild build && bun run preview -- --host 127.0.0.1 --port 4174 --strict-port',
      url: 'http://127.0.0.1:4174/en/',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'bun run --cwd ../design-lab dev -- --strictPort',
      url: 'http://127.0.0.1:4180/#console',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
