# 2026-01-30: Implemented Demand Prediction Pipeline

## Task Summary
- Integrated the ML water demand model into the system via a new `routing_service` endpoint.
- Created a Next.js Cron Job (`/api/cron`) to automate the full data pipeline.
- Refined data generation to clustering around specific community coordinates.
- Enabled automatic location seeding in Supabase.

## Technical Details

### 1. ML Service Integration (`routing_service/`)
- Added `/predict-demand` endpoint to the FastAPI app.
- Loads `water_demand_model.pkl` and `model_features.pkl` on startup.
- accepts features: `prev_day_l`, `pressure_pa`, `device_id_count`, `day_of_week`.

### 2. Telemetry Utilities (`src/lib/telemetry/`)
- **`locationAssignment.ts`**: Exports 19 hardcoded community centroids (`loc_001` - `loc_019`).
- **`dataGenerator.ts`**: Generates realistic random raw telemetry data.
    - **Update:** Now selects a random community center and applies a small random offset (~1.5km) to simulate realistic clustering, rather than using a broad bounding box.

### 3. Cron Job Logic (`src/app/api/cron/route.ts`)
- **Workflow:**
    1.  Generates 500 raw data points (clustered around communities).
    2.  Assigns locations based on nearest neighbor.
    3.  Clusters/Groups data by `location_id`.
    4.  Aggregates metrics (avg pressure, sum dispensed) to build ML features.
    5.  Calls `http://127.0.0.1:8000/predict-demand`.
    6.  **DB Update:** Checks if location exists by name.
        - If yes: Updates `water_demand_daily`.
        - If no: **Inserts** a new location record with calculated centroid, name, and predicted demand.
    - Uses `supabaseAdmin` to bypass RLS policies for server-side operations.

## Status
- **Complete.** The pipeline runs successfully.
- **Verification:** Tested with local services. Cron job correctly generated data, predicted demand (values ~2800-3100L), and inserted 19 new locations into the Supabase database.
