# Sync Rule Update - 2026-01-25

## Changes
- Updated `powersync.yaml` to include a `bucket_definitions` entry for `water_readings`.
- Verified `src/lib/powersync/AppSchema.ts` matches the SQL schema from `20260125000000_create_telemetry.sql`.

## Details
- **Sync Rule:** `SELECT * FROM water_readings` (Global sync for now, as no user ownership column exists).
- **Schema:**
  - `device_id` (TEXT)
  - `recorded_at` (TEXT/TIMESTAMPTZ)
  - `pressure_pa` (REAL)
  - `battery_voltage` (REAL)
  - `latitude` (REAL)
  - `longitude` (REAL)
