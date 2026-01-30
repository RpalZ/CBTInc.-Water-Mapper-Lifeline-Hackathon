# 2026-01-30: Updated Centroid Clustering with Location Data

## Task Summary
- Updated `src/app/api/telemetry/process-csv/route.ts` to use `augmented_telemetry_filtered_with_location.csv` as the input source.
- Confirmed and maintained the clustering radius at **15km** as per user preference.
- Regenerated `filtered_centroids.csv` and `filtered_centroids.json`.

## Technical Details
- **Input File:** `ml/data stuff/augmented_telemetry_filtered_with_location.csv` (includes `location_id`, `in_community`).
- **Radius:** 15km (Turf DBScan).
- **Results:**
    - Total input rows: 67,005
    - Filtered active rows: 16,084
    - Clusters found: 39
- **Output Files:**
    - `ml/data stuff/filtered_centroids.csv`
    - `ml/data stuff/filtered_centroids.json`

## Status
- Complete. All original columns preserved in the output.
