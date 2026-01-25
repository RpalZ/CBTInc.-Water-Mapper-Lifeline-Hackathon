# PowerSync Environment Variable Runtime Fix

**Date:** January 25, 2026  
**Task:** Fix SupabaseConnector so environment variables resolve correctly in a Next.js App Router client environment

## Root Cause: Why Module-Scope Env Access Breaks in App Router

### The Problem

In Next.js App Router, `process.env.NEXT_PUBLIC_*` environment variables are **inlined at build time** into the client bundle. When you access `process.env.NEXT_PUBLIC_*` at **module scope** (top-level of the file), Next.js evaluates and replaces these values during the build process.

**Critical Issue:** If the module is evaluated during SSR or at build time when the environment variables aren't available or aren't properly exposed, the values get permanently inlined as `undefined` in the client bundle. This happens because:

1. Next.js performs static analysis during the build
2. Module-scope code is evaluated during this analysis
3. If `process.env.NEXT_PUBLIC_*` is accessed at module scope, Next.js replaces it with the value it sees at that moment
4. If the value is `undefined` at build time, it becomes permanently `undefined` in the client bundle
5. Even if `.env.local` exists and has correct values, the client bundle already has `undefined` hardcoded

### Why Constructor Access Works

When environment variables are accessed **inside a function** (like the constructor), Next.js can still statically analyze and inline them, but the timing is different:

1. The constructor code is part of the function body, not module initialization
2. Next.js can still replace `process.env.NEXT_PUBLIC_*` with actual values during build
3. But the replacement happens in a context where the values are properly available
4. The client bundle gets the actual string values, not `undefined`

### Client-Side Safety

The `SupabaseConnector` is only instantiated:
- Inside `useEffect` in `PowerSyncContext.tsx` (client-side only)
- The component is wrapped with `dynamic(() => ..., { ssr: false })` to prevent SSR
- This ensures the constructor (and env var access) only runs on the client

## What Was Changed

### File: `src/lib/powersync/SupabaseConnector.ts`

**Before (Previous Implementation - Module Scope):**
```typescript
// ❌ WRONG - Module scope access
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string;
const POWERSYNC_URL = process.env.NEXT_PUBLIC_POWERSYNC_URL as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !POWERSYNC_URL) {
  throw new Error('Missing Supabase or PowerSync environment variables');
}

class SupabaseConnector {
  constructor(powerSync: PowerSyncDatabase) {
    this.powerSync = powerSync;
    this.supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}
```

**After (Current Implementation - Constructor Access):**
```typescript
// ✅ CORRECT - Constructor access
class SupabaseConnector {
  constructor(powerSync: PowerSyncDatabase) {
    // Read env vars inside constructor (not at module scope)
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    const POWERSYNC_URL = process.env.NEXT_PUBLIC_POWERSYNC_URL;

    // Validate immediately after reading
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !POWERSYNC_URL) {
      throw new Error('Missing Supabase or PowerSync environment variables');
    }

    this.powerSync = powerSync;
    this.powerSyncUrl = POWERSYNC_URL;
    this.supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}
```

**Key Changes:**
1. ✅ Removed all `process.env.*` access from module scope
2. ✅ Moved environment variable reading into constructor
3. ✅ Validation happens immediately after reading (inside constructor)
4. ✅ No fallback values or defaults
5. ✅ Fails loudly with clear error message if variables are missing

## Files Touched

1. **`src/lib/powersync/SupabaseConnector.ts`**
   - Environment variables now read inside constructor
   - No module-scope env access
   - Validation occurs in constructor after reading

2. **`src/lib/powersync/PowerSyncContext.tsx`** (Verified, not modified)
   - Already correctly instantiates `SupabaseConnector` inside `useEffect`
   - Component is wrapped with `dynamic(() => ..., { ssr: false })`
   - Ensures client-side only execution

## Environment Variables Used

Only the following client-safe variables are used:
- `process.env.NEXT_PUBLIC_SUPABASE_URL`
- `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `process.env.NEXT_PUBLIC_POWERSYNC_URL`

## Behavior Preservation

- ✅ Validation still occurs and throws if env vars are missing
- ✅ Same error messages
- ✅ No fallback values introduced
- ✅ No silent ignoring of missing env vars
- ✅ All PowerSync and Supabase logic unchanged
- ✅ Client-side only instantiation (via useEffect + dynamic import)

## Next.js App Router Client Bundling

### How It Works

1. **Build Time:**
   - Next.js reads `.env.local` and other env files
   - `NEXT_PUBLIC_*` variables are exposed to client-side code
   - Next.js performs static analysis of client code
   - `process.env.NEXT_PUBLIC_*` references are replaced with actual string values

2. **Runtime (Client):**
   - The client bundle contains the actual string values (not `process.env.NEXT_PUBLIC_*` references)
   - When constructor runs, it uses the inlined values
   - If values were `undefined` at build time, they remain `undefined` in the bundle

### Why Constructor Access is Safe

- Constructor code is still statically analyzed
- Next.js can identify `process.env.NEXT_PUBLIC_*` references in function bodies
- Values are properly inlined because they're accessed in a context where Next.js can resolve them
- The timing ensures values are available during the build process

## Important Notes

- ✅ `.env.local` is automatically loaded by Next.js (no manual config needed)
- ✅ Dev server must be restarted after adding/modifying `.env.local`
- ✅ Variables must be prefixed with `NEXT_PUBLIC_` to be exposed to client-side code
- ✅ This is a **client-bundling issue**, not a config issue
- ✅ No dotenv or manual env loading needed
- ✅ No Next.js config changes needed

## Verification

The fix ensures:
- Environment variables are accessed in a pattern Next.js can properly inline
- No module-scope access that could cause permanent `undefined` values
- Variables are validated before use
- Error messages remain clear if variables are missing
- Client bundle will contain actual string values (when `.env.local` is properly configured)
- Constructor only runs client-side (via useEffect + dynamic import)
