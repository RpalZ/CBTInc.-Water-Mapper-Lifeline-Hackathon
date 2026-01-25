# Environment Variable Error Fix

**Date:** January 25, 2026  
**Task:** Fix environment variable error without changing application behavior or architecture

## Root Cause Explanation

The error occurred because `SupabaseConnector.ts` was validating environment variables at **module scope** (lines 4-12 in the original file). When Next.js performs Server-Side Rendering (SSR), it evaluates all imported modules, including `SupabaseConnector.ts`, even though the actual PowerSync initialization happens client-side only via `dynamic(() => ..., { ssr: false })`.

The module-scope validation check:
```typescript
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !POWERSYNC_URL) {
  throw new Error('Missing Supabase or PowerSync environment variables');
}
```

This code executed during SSR when environment variables might not be available or when the module is being evaluated, causing the application to crash before client-side initialization could occur.

## What Was Changed

### File: `src/lib/powersync/SupabaseConnector.ts`

**Before:**
- Environment variables were read and validated at module scope (top-level)
- Validation threw immediately when the module was imported
- Variables were stored as module-level constants

**After:**
- Environment variables are now read and validated **inside the constructor**
- Validation only occurs when `new SupabaseConnector()` is instantiated
- Since instantiation happens inside `useEffect` in `PowerSyncContext.tsx` (client-side only), validation now runs only on the client
- Environment variable values are stored as instance properties (`this.powerSyncUrl`) for use in methods

**Key Changes:**
1. Removed module-scope variable declarations and validation
2. Moved environment variable reading into constructor
3. Added validation check inside constructor (runs only when instantiated)
4. Stored `POWERSYNC_URL` as instance property `this.powerSyncUrl` for use in `fetchCredentials()` method
5. Updated `fetchCredentials()` to use `this.powerSyncUrl` instead of module-scope constant

## Files Touched

1. **`src/lib/powersync/SupabaseConnector.ts`**
   - Moved environment variable validation from module scope to constructor
   - Changed `POWERSYNC_URL` from module constant to instance property
   - Updated `fetchCredentials()` method to use instance property

## Behavior Preservation

- ✅ Validation still occurs and throws errors if env vars are missing
- ✅ No fallback values introduced
- ✅ No silent ignoring of missing env vars
- ✅ Same error message format maintained
- ✅ PowerSync initialization flow unchanged
- ✅ Supabase client creation logic unchanged
- ✅ All methods continue to work identically

## SSR Safety

The fix ensures that:
- Module can be imported during SSR without throwing
- Validation only runs when constructor is called (client-side)
- No environment variable access occurs at module evaluation time
- PowerSync initialization remains client-side only as designed

## Testing Notes

- Module can now be imported during SSR without errors
- Validation still occurs when `new SupabaseConnector()` is called
- Error messages remain the same if env vars are missing
- All existing functionality preserved
