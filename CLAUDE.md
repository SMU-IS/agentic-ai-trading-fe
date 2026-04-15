# CLAUDE.md

## Project Overview

Agent M is a Next.js 15 / React 19 frontend for an agentic AI trading portfolio manager, built for UBS in collaboration with SMU-IS. It features a real-time portfolio dashboard, AI chat with streaming/markdown support, trade history, AgentFlow visualization, and stock charts.

## Directory Map

```
app/                  # Next.js App Router pages and layouts
  portfolio/          # Main dashboard (Portfolio, Trades, AgentFlow tabs)
  login/              # Auth page
components/
  ui/                 # shadcn/ui primitives (do not hand-edit; regenerate via CLI)
  portfolio/          # Holdings table, performance chart, chat interface, etc.
  agentflow/          # React Flow-based agent pipeline diagram
  trades/             # Trade history and modal components
  bento/              # Landing page bento grid sections
hooks/                # Custom hooks (use-mobile, use-agent-metrics, use-toast, etc.)
lib/                  # auth-context, types, utils, tickerMap
public/               # Static assets
```

## Package Manager & Dev Commands

Package manager: **npm** (package-lock.json)

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check (used in CI)
```

## Code Style

Derived from `.prettierrc.json`, `tsconfig.json`, and existing components:

- **No semicolons** — Prettier enforces `semi: false`
- **Double quotes** for strings (`singleQuote: false`)
- **TypeScript strict mode** — all new files must be `.ts` / `.tsx`
- **Path alias** `@/` maps to repo root — use it for all imports
- **`"use client"`** directive at top of any component using hooks or browser APIs
- **shadcn/ui** conventions: components in `components/ui/`, added via `npx shadcn@latest add <name>`
- Tailwind classes via `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- Dark mode via `class` strategy — use `dark:` variants, not JS theme checks

## Testing

No test suite is configured in this repo (no vitest/jest config found). CI only runs `format:check` and `build`.

## Git & Commit Conventions

No commitlint config found. Recent commit history uses conventional-style prefixes informally:

```
feat: <description>
fix: <description>
chore: <description>
change: <description>
```

CI/CD deploys to **AWS Amplify** automatically on push to `main`.

## Environment

Requires `.env.local` — see README.md for required variables. Do not commit this file.

## Further Docs

- [README.md](README.md) — feature list, env var reference, tech stack, contributing guide
- [.github/workflows/trading-agent-ci-cd.yml](.github/workflows/trading-agent-ci-cd.yml) — CI/CD pipeline details
- [components.json](components.json) — shadcn/ui configuration
