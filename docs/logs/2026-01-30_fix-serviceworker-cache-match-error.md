## 2026-01-30_fix-serviceworker-cache-match-error

**Task:** Address `TypeError: Failed to execute 'match' on 'CacheStorage'` and `TypeError: Failed to execute 'match' on 'Cache'` originating from `sw.js`.

**Changes Made:**
- Removed `navigationPreload: true` from the `Serwist` configuration in `src/app/sw.ts`. This feature can sometimes cause subtle timing issues or incompatibilities with the Service Worker's Cache API, especially when running on potentially unstable Next.js versions.

**Rationale:**
The errors indicate a problem with accessing the Cache API's `match()` method, suggesting that the `Cache` or `CacheStorage` object might not be fully initialized or available at the time of access. Removing `navigationPreload` is a common troubleshooting step for Service Worker issues related to timing and lifecycle.

**Verification:**
- The application should be tested to see if the console errors related to `sw.js` and `cache.match` are no longer present.