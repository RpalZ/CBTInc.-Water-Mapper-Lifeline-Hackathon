# Database Schema Update: Foreign Key Indexes

**Date:** 2026-01-29

## Summary
Ensured that all foreign key relationships for `vehicle`, `device`, and `location` tables explicitly support **one-to-many** relationships (non-unique) and are optimized for performance.

## Changes

1.  **Migration:** `supabase/migrations/20260129010000_ensure_fk_indexes.sql`
2.  **Indexes Created (Non-Unique):**
    -   `idx_vehicle_assigned_location_id` on `vehicle(assigned_location_id)`
    -   `idx_device_vehicle_id` on `device(vehicle_id)`
    -   `idx_location_owner` on `location(owner)`
    -   `idx_vehicle_owner` on `vehicle(owner)`
3.  **Documentation:** Added SQL comments to columns to explicitly state they are non-unique foreign keys.

## Impact
-   **Performance:** Lookup queries filtering by these foreign keys (e.g., "Find all vehicles at Depot X") will now be significantly faster.
-   **Integrity:** Confirmed no `UNIQUE` constraints exist on these relationships, ensuring multiple child records can reference the same parent.
