import { defineRailway, github, postgres, preserve, project, service } from 'railway/iac'

/** Every service must be listed and named as the dashboard names it: an omission reads as a deletion. */
export default defineRailway(() => {
  const repository = github('PuppetAJ/Wicken', { checkSuites: true })

  const database = postgres('Postgres')

  const app = service('Wicken', {
    source: repository,
    build: 'pnpm build',
    start: 'pnpm db:migrate && pnpm db:seed:empty && pnpm start',
    deploy: {
      healthcheckPath: '/api/health',
      healthcheckTimeout: 100,
      sleepApplication: true,
      numReplicas: 1,
    },
    env: {
      NODE_ENV: 'production',
      PORT: '8080',
      NEXT_PUBLIC_APP_URL: 'https://wicken.up.railway.app',
      DATABASE_URL: '${{Postgres.DATABASE_URL}}',
      APP_DATABASE_URL:
        'postgresql://wicken_app:${{Wicken.APP_DATABASE_PASSWORD}}@${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}',
      // Letters and digits only: it is spliced into the URL above, where a / breaks parsing.
      APP_DATABASE_PASSWORD: preserve(),
      BETTER_AUTH_SECRET: preserve(),
      STRIPE_SECRET_KEY: preserve(),
      STRIPE_WEBHOOK_SECRET: preserve(),
      GOOGLE_CLIENT_ID: preserve(),
      GOOGLE_CLIENT_SECRET: preserve(),
    },
  })

  const reset = service('Reset', {
    source: repository,
    build: 'pnpm install --frozen-lockfile',
    start: 'pnpm db:migrate && pnpm db:seed',
    deploy: {
      cronSchedule: '0 4 * * *',
      restartPolicyType: 'NEVER',
    },
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: '${{Postgres.DATABASE_URL}}',
      BETTER_AUTH_SECRET: '${{Wicken.BETTER_AUTH_SECRET}}',
    },
  })

  return project('wicken', { resources: [database, app, reset] })
})
