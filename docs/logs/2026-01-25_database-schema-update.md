# Database Schema & Sync Update - 2026-01-25

## Summary
As a Senior Database Engineer, I have executed the approved database migration plan. This involved creating a new Supabase migration, updating the client-side PowerSync schema, and configuring the sync rules.

## Changes

1.  **New Supabase Migration:**
    - Created `supabase/migrations/20260125010000_create_core_tables.sql`.
    - **Action:** Dropped the old `water_readings` table.
    - **Action:** Created `users`, `device`, `"Locations"`, and the new `water_readings` tables with the specified columns, types, and foreign key relationships (`ON DELETE CASCADE`).
    - **Action:** Enabled Row Level Security (RLS) on all new tables.
    - **Action:** Added all new tables to the `powersync` publication in Supabase.

2.  **PowerSync Client Schema Update:**
    - Modified `src/lib/powersync/AppSchema.ts` to reflect the new database structure.
    - Added tables for `users`, `device`, and `locations`.
    - Updated `water_readings` to match the new definition.

3.  **PowerSync Sync Rules Update:**
    - Overhauled `powersync.yaml` to use the `sync_rules` format.
    - Added sync rules for `users`, `devices`, `locations`, and `water_readings` to pull all data from the backend.
