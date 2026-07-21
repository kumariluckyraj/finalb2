# PostgreSQL Layer

This folder contains the PostgreSQL implementation used by the app.

## Files

- `schema.sql`: PostgreSQL schema definition.
- `lib/db.ts`: connection pool and query helpers.
- `models/`: entity/type definitions.
- `repositories/`: CRUD helpers that mirror the MongoDB behavior.
- `scripts/apply-schema.ts`: create tables and indexes.
- `scripts/seed.ts`: initialize baseline PostgreSQL data.
- `scripts/migrate-from-mongo.ts`: imports exported JSON data into PostgreSQL.

## Install

```bash
npm install
```

## Configure

Set the PostgreSQL variables in `.env.local`:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_postgres_db
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_SSL=false
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=5000
```

## Run Schema

```bash
npm run db:pg:schema
```

## Run Seed

```bash
npm run db:pg:seed
```

The repository does not include static sample fixtures, so seeding currently just initializes the singleton cart row.

## Import Existing Data

```bash
npm run db:pg:migrate
```

The importer expects JSON exports in `postgres/migration-source/` by default:

- `users.json`
- `vendor_applications.json`
- `products.json`
- `orders.json`
- `reviews.json`
- `otps.json`
- `cart.json`

## Notes

- PostgreSQL is the app database.
- MongoDB runtime files were removed from the app.
