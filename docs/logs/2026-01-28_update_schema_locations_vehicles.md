# Schema Update: Locations and Vehicles

**Date:** 2026-01-28

## Changes

1.  **Database Migration:**
    - Created `supabase/migrations/20260128000000_replace_locations_add_vehicles.sql`.
    - Dropped the existing `Locations` table.
    - Created new types: `location_label` ('community', 'depot') and `vehicle_type` ('truck', 'car').
    - Created `location` table with fields: `id`, `water_demand_daily`, `latitude`, `longitude`, `label`, `owner`, `runout_probability`.
    - Created `vehicle` table with fields: `id`, `capacity`, `latitude`, `longitude`, `type`, `owner`.
    - Enabled RLS on both tables and added CRUD policies ensuring users can only access their own data (`auth.uid() = owner`).
    - Added both tables to the `powersync` publication (updated logic to handle 'FOR ALL TABLES').
    - Applied migration `20260128000000_replace_locations_add_vehicles.sql` to the database.

2.  **PowerSync Schema:**
    - Updated `src/lib/powersync/schema.ts` to reflect the database changes using the `column` helper syntax.
    - Replaced `locations` table definition with `location`.
    - Added `vehicle` table definition.
    - Removed redundant `src/lib/powersync/AppSchema.ts`.
