# Schema Update for New Features

**Date:** 2026-01-29

## Changes

1.  **Database Migration:**
    -   Created `supabase/migrations/20260129000000_add_names_and_relations.sql`.
    -   Applied the migration to the database.
    -   **Changes:**
        -   `location` table: Added `name` (TEXT).
        -   `vehicle` table: Added `name` (TEXT) and `assigned_location_id` (UUID, Foreign Key to `location`).
        -   `device` table: Added `vehicle_id` (UUID, Foreign Key to `vehicle`).

2.  **PowerSync Schema:**
    -   Updated `src/lib/powersync/schema.ts` to reflect the new columns.
    -   Mapped UUID foreign keys to `column.text` as per PowerSync conventions.

These changes support the new requirements for creating/labeling locations and vehicles, assigning vehicles to depots, and linking devices to vehicles.
