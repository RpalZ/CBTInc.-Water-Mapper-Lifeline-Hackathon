PRD Prompt: Local-First PWA with PowerSync & Supabase
Project Goal: Build a high-performance, offline-first PWA using Next.js 15. The app must allow users to interact with data offline via a local SQLite database, with automatic cloud synchronization to Supabase provided by PowerSync.

Core Technical Stack:

Frontend: Next.js (App Router), Tailwind CSS.

PWA: Serwist for service worker management and asset caching.

Sync Engine: PowerSync (Web SDK).

Local DB: SQLite (WASM) via OPFS (Origin Private File System), managed by PowerSync.

Cloud DB: Supabase (PostgreSQL).

Backend: Node.js (Next.js API routes) as the PowerSyncBackendConnector to handle authenticated writes.

Key Architecture Requirements:

SharedArrayBuffer & Security: - Implement middleware.ts to set COOP: same-origin and COEP: require-corp headers. This is mandatory for PowerSync's high-speed OPFS storage.

PowerSync Implementation:

Initialize a PowerSyncDatabase instance in a client-side context (using ssr: false).

Define an AppSchema that mirrors the Supabase tables.

Implement a SupabaseConnector class that follows the PowerSync interface to handle fetchCredentials (JWT from Supabase Auth) and uploadData (sending local changes to Supabase via a Node.js endpoint).

Local-First UI:

Use @powersync/react hooks (like useQuery) to make the UI reactive. Data should appear instantly as it's saved to the local SQLite DB.

Provide a "Sync Status" indicator using the PowerSync status object.

PWA Features:

Ensure the app is fully installable with a valid manifest.ts.

Configure the service worker to cache the "App Shell" so the UI loads instantly even without a network.