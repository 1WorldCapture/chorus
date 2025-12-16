# Chorus Development Agent Guide

Chorus is a native macOS AI chat app built with Tauri (Rust) + React/Vite (TypeScript). The UI talks to a local SQLite DB (via `@tauri-apps/plugin-sql`) and invokes native capabilities (windowing, screenshots, file IO) via Tauri commands. It also supports MCP toolsets by running local “sidecar” binaries.

## Quick Start (Commands)

-   **Install + per-instance setup:** `pnpm run setup [instance-name]`
-   **Run dev (isolated instance):** `pnpm run dev [instance-name]`
-   **Vite only:** `pnpm run vite:dev`
-   **Tauri dev:** `pnpm run tauri:dev` (uses `src-tauri/tauri.dev.conf.json`)
-   **Tauri QA/Prod configs:** `pnpm run tauri:qa`, `pnpm run tauri:prod`
-   **Typecheck + build UI:** `pnpm run build`
-   **Tests:** `pnpm test`
-   **Lint/format:** `pnpm run lint`, `pnpm run format`
-   **Repo checks:** `pnpm run validate` (or `pnpm run validate:fix`)
-   **Regenerate DB schema docs:** `pnpm run generate-schema`
-   **Delete local DB (dev helper):** `pnpm run delete-db`

## Architecture Overview

### Frontend (React/TypeScript)

-   Entry: `src/ui/main.tsx` → `src/ui/App.tsx`
-   Routing: `react-router-dom` routes in `src/ui/App.tsx`
-   Data fetching/caching: TanStack Query patterns in `src/core/chorus/api/*`
-   UI layer: `src/ui/components/*` and shadcn-style primitives in `src/ui/components/ui/*`

### Backend (Tauri/Rust)

-   Entry: `src-tauri/src/main.rs` → `src-tauri/src/lib.rs`
-   Commands exposed to TS (via `invoke`): `src-tauri/src/command.rs` (wired in `src-tauri/src/lib.rs`)
-   Quick Chat window: a macOS “spotlight panel” (`tauri-nspanel`) labeled `quick-chat` (see `src-tauri/src/window.rs`)
-   Local DB: SQLite via `tauri-plugin-sql` with embedded migrations (see `src-tauri/src/migrations.rs`)

### Data Layer (SQLite)

-   Runtime DB file: `chats.db` in the app’s data directory (varies by instance)
-   TS access:
    -   Global handle: `src/core/chorus/DB.ts` (`export const db = await Database.load(...)`)
    -   UI context: `DatabaseProvider` in `src/ui/App.tsx` + `src/ui/providers/DatabaseProvider.tsx`
-   Schema docs: `SCHEMA.md` is auto-generated from `src-tauri/src/migrations.rs` (do not edit manually)

### Tooling + MCP (Model Context Protocol)

-   Toolsets system: `src/core/chorus/Toolsets.ts` and `src/core/chorus/ToolsetsManager.ts`
-   MCP transport adapted for Tauri: `src/core/chorus/MCPStdioTauri.ts` (spawns sidecars via `@tauri-apps/plugin-shell`)
-   Sidecar binaries shipped with the app: `src-tauri/binaries/*` (e.g. `mcp-github-*`, `mcp-desktopcommander-*`)

## Repo Layout (Where To Look First)

-   **UI shell + routing:** `src/ui/App.tsx`
-   **Main chat UX:** `src/ui/components/MultiChat.tsx`
-   **Chat input:** `src/ui/components/ChatInput.tsx`
-   **Sidebar + projects navigation:** `src/ui/components/AppSidebar.tsx`, `src/ui/components/ProjectView.tsx`
-   **TanStack Query layer:** `src/core/chorus/api/*` (queries + mutations per entity)
-   **Model providers:** `src/core/chorus/ModelProviders/*` (implement `IProvider`)
-   **DB migrations (source of truth):** `src-tauri/src/migrations.rs`

## Dev Instances (How `pnpm run dev` Works)

`pnpm run dev [instance]` runs `./script/dev-instance.sh` to enable multiple isolated dev instances on one machine:

-   Data dir: `~/Library/Application Support/sh.chorus.app.dev.<instance>/`
-   Per-instance env:
    -   `CHORUS_INSTANCE_NAME` (shown in UI)
    -   `VITE_PORT` / `VITE_HMR_PORT` (stable ports derived from instance name)

See `script/README.md` for details.

## Conventions (Keep Changes Consistent)

-   **TypeScript:** `strict: true` (see `tsconfig.json`), avoid `as` except as a last resort.
-   **Imports:** Prefer aliases (`@ui/*`, `@core/*`, `@/*`) over deep relative paths.
-   **Promises:** No floating promises (`@typescript-eslint/no-floating-promises` is enforced).
-   **Null vs undefined:** Prefer `undefined` in app code; normalize DB `NULL` via `row.some_col ?? undefined`.
-   **Formatting:** Prettier with 4-space indentation (`.prettierrc` → `tabWidth: 4`).
-   **Serialized structures:** If a type is persisted in SQLite (e.g. `UserToolCall` / `UserToolResult` in `src/core/chorus/Toolsets.ts`), do not change existing fields or add new required fields.
-   **Migrations:** Never edit a previous migration in `src-tauri/src/migrations.rs`. Add a new one.
-   **Schema docs:** Do not edit `SCHEMA.md` directly; run `pnpm run generate-schema`.

## Making DB/Data Model Changes (Typical Checklist)

-   Add a new migration in `src-tauri/src/migrations.rs`.
-   Update TS row types + readers/writers in `src/core/chorus/api/*` (and anywhere else that reads those tables).
-   Regenerate schema docs: `pnpm run generate-schema` (updates `SCHEMA.md`).

## Tauri Command Surface (Crossing the Rust/TS Boundary)

-   Rust commands live in `src-tauri/src/command.rs` and are registered in `src-tauri/src/lib.rs`.
-   TS calls them with `invoke(...)` (examples: theme sync, screenshot permissions, file writes).
