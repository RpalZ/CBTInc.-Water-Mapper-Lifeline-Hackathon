# 2026-01-31 Update ML Prediction Input

## Changes
- Updated `PredictionRequest` in `routing_service/main.py` to include `location_name`.
- Updated `predict_demand` in `routing_service/main.py` to map `location_name` to `location_id` in the input DataFrame.
- Updated `src/app/api/cron/route.ts` to include `location_name` in the payload sent to the ML service.
