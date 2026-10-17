import { loadEnvFile } from 'node:process'
import { defineConfig, devices } from '@playwright/test'

try {
  loadEnvFile('.env')
} catch {
  // CI sets its variables directly.
}

const CI = Boolean(process.env.CI)

/**
 * The browser suites run against an app that is already up: `pnpm dev` locally, a production build on CI. They share
 * one seeded database, so one test at a time, in file order. `pnpm test:e2e` runs the five areas, `pnpm test:e2e cart`
 * one of them, and `pnpm test:a11y` the accessibility audit.
 */
export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.mjs',
  workers: 1,
  timeout: 5 * 60_000,
  // Once on CI; a test that passes on its retry is marked flaky rather than hidden.
  retries: CI ? 1 : 0,
  forbidOnly: CI,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    trace: CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'suites', testIgnore: 'a11y.spec.mjs' },
    { name: 'a11y', testMatch: 'a11y.spec.mjs' },
  ],
})
