import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { defineConfig, devices } from '@playwright/test'

if (existsSync('.env')) loadEnvFile('.env')

const CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.mjs',
  workers: 1,
  timeout: 5 * 60_000,
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
