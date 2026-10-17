# Wicken

A storefront for a fictional two-person studio in Hudson, New York that makes ceramics and furniture
and sells a few things from workshops it buys from. Browsing, filtering, a cart that survives signing
in, Stripe checkout in test mode, reviews, favorites, and an admin area that writes to the real
database.

It is a portfolio project. No order is fulfilled and no card is ever charged.

**Live: [wicken.up.railway.app](https://wicken.up.railway.app)** — log in with the **Demo shopper**
or **Demo admin** button and pay with `4242 4242 4242 4242`.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/screenshots/home-dark.webp">
  <img src=".github/screenshots/home-light.webp" alt="The Wicken landing page: the headline Made slowly, to be kept, beside a photograph of teaware in window light, with the six categories underneath" width="100%">
</picture>

## What it is built on

Next.js 16 on the App Router, with Cache Components and partial prerendering: a page's shell is
prerendered and the parts that depend on who is asking stream in behind Suspense. React 19,
TypeScript, Tailwind 4, Postgres talked to directly through `pg` rather than an ORM, Better Auth for
sessions with email or Google, Stripe for checkout, Motion for the reveals.

Tooling: pnpm, oxlint instead of ESLint, Node's own test runner instead of Jest, and Playwright
Test for the browser suites.

## Running it

You need Node (the version in `.node-version`), pnpm, and Docker for the database.

```sh
pnpm install
cp .env.example .env        # then fill in BETTER_AUTH_SECRET at least
pnpm db:up                  # Postgres in Docker, bound to 127.0.0.1
pnpm db:migrate
pnpm db:seed                # 47 products, two demo accounts, reviews, orders
pnpm dev
```

The seed creates `shopper@wicken.store` and `admin@wicken.store`, both with the password
`demo-password`. The login page has a button for each, so you never have to type them.

Stripe and Google sign-in are optional. Leave their keys out and checkout and the Google button
switch themselves off rather than failing.

## Tests

```sh
pnpm test        # unit tests, on their own database
pnpm test:e2e    # the browser suites, against a running app
pnpm test:a11y   # axe over every page, signed out and signed in
```

The browser suites need the app running and the database seeded. They default to
`http://localhost:3000` and print which server they are using; point them elsewhere with
`E2E_BASE_URL`. They are split into five areas and `pnpm test:e2e` runs them in order, or
`pnpm test:e2e admin` runs one. In CI each area gets its own runner, and the app runs under the
same restricted database role it uses in production.

## How the code is arranged

Imports run one way and the linter enforces it: `app` may use `features`, `features` may use
`components` and `lib`, and the leaves never reach back up. A feature may not import another
feature; anything two features need lives in `components` or `lib`.

```
src/app          routes, grouped by (store), (auth) and admin
src/features     a folder per slice: actions, schemas, and the components that use them
src/components   elements and sections shared across features, plus vendored shadcn in ui/
src/lib          database queries, auth, formatting, environment
e2e              Playwright suites, one file per area
scripts          the seed and its demo data, and the test database setup
migrations       SQL, applied with node-pg-migrate
```

Every server action returns the same shape, `{ error?: string; ok?: number }`, where `ok` is a fresh
timestamp so a second success is distinguishable from the first.

## Notes worth knowing

**Payment is confirmed two ways.** An order is created as pending and priced from the products table
before Stripe is involved. Stripe's webhook marks it paid, and so does the success page by asking
Stripe directly, so a missed webhook never strands an order. Both go through one `UPDATE … WHERE
status = 'pending'`, so whichever arrives second changes nothing.

**The database is the source of truth for vocabularies.** Categories, colors, materials, order
statuses and makers are `CHECK` constraints, and the TypeScript unions in `src/lib/db/types.ts`
mirror them. Changing one means a migration that drops the constraint, updates the rows, and adds it
back.

**Lead times are per category.** Tableware ships in days, furniture is cut to order and takes weeks.
An order ships together, so checkout quotes the slowest thing in it. All of it comes from one table
in `src/lib/lead-times.ts`.

**The landing page's reads are deliberately uncached.** A `"use cache"` result sitting in that page's
prerendered shell leaves the router's segment prefetch of `/` open indefinitely. The comment in
`src/features/products/data.ts` says so at the point it matters.

**Photographs come from Unsplash and Pexels** and every one is credited in
`public/images/credits.json`.

## Deployment

Railway, described in code in `.railway/railway.ts` and applied with `railway config apply`: a
Postgres database, the app, and a nightly cron that migrates and reseeds, because the admin writes
for real and somebody has to put the shop back. The app sleeps after ten idle minutes and wakes on
the next request.

The app migrates on boot and seeds itself only if the catalog is empty, so a fresh environment comes
up populated rather than waiting for the small hours. Migrating and seeding run as the database
owner; the app itself connects as `wicken_app`, a role the migrations create that can change rows
but not the schema. Each environment gives that role a password, and the browser suite runs the app
under it so a missing grant fails the pull request rather than the deploy.

`railway config plan` is worth running first; the file is authoritative, so a variable it does not
mention is a variable it will delete. The secrets live in the dashboard and appear here as
`preserve()` for exactly that reason.
