# 2026-01-31 Fix ML Model Version Mismatch

## Issue
The user reported that the ML prediction was constantly returning a value around ~3008, regardless of the location input.

## Root Cause Analysis
1.  Inspection of `routing_service/model_features.pkl` revealed that the model expected features `['prev_day_l', 'pressure_pa', 'device_id', 'day_of_week']`, **excluding** `location_encoded`.
2.  Inspection of `ml/code/model_features.pkl` showed the correct feature list: `['location_encoded', 'prev_day_l', 'pressure_pa', 'device_id', 'day_of_week']`.
3.  The model files in `routing_service/` were outdated (timestamp Jan 30 vs Jan 31 in `ml/code/`).
4.  Consequently, the `routing_service` was effectively ignoring the location input, leading to generic predictions.

## Fix
1.  Updated `routing_service/main.py` to:
    - Load `location_encoder.pkl`.
    - Encode `location_name` to `location_encoded` integer.
    - Pass the encoded location to the model.
2.  Copied the latest model artifacts from `ml/code/` to `routing_service/`:
    - `water_demand_model.pkl`
    - `model_features.pkl`
    - `location_encoder.pkl`

## Verification
- Verified that the new `model_features.pkl` in `routing_service` now includes `location_encoded`.
- Ran a test prediction against a local instance of the service, confirming that `location_encoded` is used and the prediction value changes.
