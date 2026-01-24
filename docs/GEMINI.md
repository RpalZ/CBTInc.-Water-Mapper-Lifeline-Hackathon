# Gemini AI Project Guide: PowerSync Edition

## 🛠 Core Stack (Local-First)
- **Next.js 15 + Serwist** (PWA/Frontend)
- **PowerSync Web SDK** (Sync Layer)
- **SQLite (WASM/OPFS)** (Local Persistence)
- **Supabase** (Cloud Backend/Auth)

## 🔄 PowerSync Logic
- **Schema:** The `AppSchema.ts` is the source of truth for the local SQLite structure.
- **Connector:** Use the `BackendConnector` to route writes. Local changes are placed in an "Upload Queue" by PowerSync and sent to our Node.js `/api/sync` route.
- **Auth:** Sync Supabase Auth JWTs with PowerSync to ensure users only see their own data via PowerSync "Sync Rules".

## 🤖 Assistant Context
- When generating SQL queries, remember they run against the **Local SQLite** database via PowerSync.
- Use `useQuery` for reactive data fetching in React components.
- Ensure all database initialization happens in a `Suspense` boundary or a `dynamic(() => ..., { ssr: false })` component.

## Logging
- After making changes, please summarize and log your changes in docs/logs using a formatted name: {date}_{task-name}.md