# Telemetry Analysis Endpoint Implementation

**Date:** 2026-01-29

## Summary
Implemented a new API endpoint (`/api/telemetry`) to identify "active" water points based on recent telemetry data. This endpoint processes raw readings to find locations with significant water usage (pressure changes) and groups them geographically to handle GPS drift.

## Logic Flow

1.  **Data Fetching:**
    -   Queries `water_readings` from Supabase via `supabaseAdmin`.
    -   Filters for records from the last **24 hours**.

2.  **Activity Detection (Pressure Filtering):**
    -   Groups readings by `device_id`.
    -   Calculates the pressure range (`max - min`) for each device.
    -   **Threshold:** Only devices with a pressure delta > **2000 Pa** (approx. 0.2m head change) are considered "active".

3.  **Spatial Clustering (DBSCAN):**
    -   Uses `@turf/clusters-dbscan` to group active devices that are physically close (within **100m**).
    -   This accounts for GPS drift or multiple sensors at the same site.

4.  **Centroid Calculation:**
    -   Calculates the geometric centroid (center point) for each cluster.
    -   Returns a simplified list of these active centroids with metadata (device count, average pressure change).

## Usage
-   **Method:** `POST`
-   **Response:** JSON object containing `count` and an array of `clusters` (GeoJSON Point geometries).

## Dependencies
-   Added `@turf/turf` for spatial analysis.
