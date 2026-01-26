# Routing Engine Usage Guide

This guide explains how to use and configure the hybrid Fleet Routing system (OR-Tools + OSRM) integrated into `LifelineMap.tsx`.

## System Overview

The system optimizes routes for a fleet of water tankers operating from multiple regional depots in Sudan. It uses:
1.  **Backend (Python):** Google OR-Tools solves the VRP (Vehicle Routing Problem).
2.  **Frontend (React):** Orchestrates the solution and fetches road geometries from OSRM.

## Configuration Parameters

You can adjust fleet parameters directly in `src/components/LifelineMap.tsx` within the `loadFleetRoutes` function.

### 1. Fleet Size & Assignment
To change the number of vehicles:
```typescript
const num_vehicles = 20; // Set desired fleet size
```
The code automatically distributes these vehicles evenly among the 4 depots.

### 2. Depots
Depots are defined in the `DEPOTS` array. Currently configured for:
- Khartoum
- Port Sudan
- El Obeid
- Nyala

### 3. Constraints (The "Goldilocks Zone")
These control the solver's behavior:
```typescript
max_distance_meters: 2000000, // 2000km max travel per truck
vehicle_capacity: 2500,       // 2500L capacity per truck
```
- **Increase Capacity:** Fewer trucks will be used (more efficient).
- **Decrease Capacity:** More trucks will be forced into service.
- **Increase Demand:** If community demand rises (drought), more trucks are needed.

## Troubleshooting

### "ReferenceError: response is not defined"
This indicates a stale build cache.
1. Stop the Next.js server.
2. Delete `.next` folder (`rm -rf .next`).
3. Restart server (`npm run dev`).

### "NO_SOLUTION_FOUND"
The constraints are too strict for the geography.
- **Fix:** Increase `max_distance_meters` or `vehicle_capacity` in `LifelineMap.tsx`.
- **Fix:** Ensure `num_vehicles` is sufficient for the total demand.

### "Too Many Requests" (OSRM)
The public OSRM API is rate-limiting the requests.
- **Fix:** Increase the `sleep(250)` delay in `LifelineMap.tsx` to `sleep(500)` or more.

## Future Integration
To connect real data:
1. Replace `COMMUNITY_COORDS` with a query from your PowerSync `water_readings` table.
2. Map the `pressure_pa` to `demand` (e.g., lower pressure = higher demand).
