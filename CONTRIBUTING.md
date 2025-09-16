# Contributing Guide

Thank you for your interest in contributing!

## Quick Setup

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Set up environment:**

   ```bash
   cp .env.example .env
   ```

3. **Start services:**

   Make sure you have Docker running, then:

   ```bash
   docker-compose up -d
   ```

4. **Initialize databases:**

   ```bash
   bun run db:push        # Apply database schema
   bun run clickhouse:init # Initialize ClickHouse for basket
   ```

5. **Build SDK:**

   ```bash
   bun run sdk:build
   ```

6. **Start development servers:**

```bash
bun run dev
```

8. **Seed the database with sample data (optional):**

```bash
bun db:seed <WEBSITE_ID> [DOMAIN] [EVENT_COUNT]
```

**Examples:**

```bash
bun db:seed g0zlgMtBaXzIP1EGY2ieG onlybuddies.com 10000
bun db:seed d7zlgMtBaSzIL1EGR2ieR notmybuddy.cc 5000
```

**Note:** You can find your website ID in your website overview settings.

> **Tip:**
> If you want to just develop on the dashboard run:
> `bun run dev --filter=@databuddy/api --filter=@databuddy/dashboard`

## Essential Commands

- `bun run dev` - Start all applications
- `bun run db:push` - Apply database changes
- `bun run sdk:build` - Build the SDK
- `bun run clickhouse:init` - Initialize ClickHouse for basket

## How to Contribute

- Fork the repository and create a new branch
- Make your changes
- Run `bun run lint` and `bun run format` before committing
- Open a pull request to the STAGING branch

## Code Style

- Use Biome for linting and formatting
- Follow the coding standards in the README
- Keep it simple and type-safe
