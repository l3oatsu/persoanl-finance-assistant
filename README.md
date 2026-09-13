# TumbleZ Finance

TumbleZ Finance is a concept-first personal finance workspace that combines net-worth tracking with installment planning.

## Local development

```bash
npm start
```

Open `http://127.0.0.1:4173/` and use the demo workspace:

- Email: `demo@tumblez.finance`
- PIN: `1234`

The local API uses SQLite only for development. The Cloudflare deployment target is `worker.mjs` with the D1 binding `DB` and the static asset binding `ASSETS`.

## Cloudflare setup

Apply `db/schema.sql`, then `db/seed.sql` to the D1 database. Set `SESSION_SECRET` as a Cloudflare secret before production use. Bank logo assets are stored under `dist/assets/banks` and referenced by each card record.

