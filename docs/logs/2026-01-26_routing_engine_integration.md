# Routing Engine Integration & Multi-Depot Support - 2026-01-26

## Summary
Successfully integrated a hybrid routing architecture combining **Google OR-Tools** (backend optimization) and **OSRM** (frontend visualization). The system now supports **Multi-Depot Vehicle Routing (MDVRP)**, servicing 20 communities across Sudan from 4 regional depots.

## Key Architectures Implemented

### 1. Hybrid Routing Engine
- **Planner (Backend):** The Python FastAPI service (`/solve-vrp`) calculates the optimal *sequence* of stops for each vehicle, respecting capacity and distance constraints.
- **Visualizer (Frontend):** The React component (`LifelineMap.tsx`) takes this sequence and fetches real-world road geometries for each segment from the public OSRM API.
- **Orchestrator:** The `loadFleetRoutes` function manages this flow, including parallel fetching and fallback handling.

### 2. Multi-Depot Support
- **Infrastructure:** Configured 4 regional depots:
  - Khartoum (Central)
  - Port Sudan (East)
  - El Obeid (South)
  - Nyala (West)
- **Fleet Assignment:** The fleet of 10 vehicles is distributed among these depots.
- **Constraint Tuning:** Adjusted vehicle capacity (2500L) and max distance (2000km) to force efficient utilization of the fleet across Sudan's vast geography.

### 3. Interactive Fleet Dashboard
- **Vehicle Filter:** Added a floating UI panel to toggle visibility of individual vehicle routes.
- **Rich Popups:**
  - **Routes:** Click a line to see Vehicle ID and Total Distance.
  - **Communities:** Click a stop to see Demand (Liters) and Stop Sequence.
  - **Depots:** Click a start point to identify the regional hub.
- **Visuals:** Implemented distinct colors for each vehicle route for clarity.

## Technical Improvements
- **Rate Limiting:** Implemented sequential fetching with delays (`sleep(250ms)`) for OSRM calls to prevent HTTP 429 errors.
- **Error Handling:** Added robust error catching for individual segment failures (falling back to straight lines).
- **Code Quality:** Refactored `LifelineMap.tsx` to remove unused placeholder logic (geolocation) and ensure type safety with new interfaces (`SolveResponse`, `VehicleRoute`).

## Files Modified/Created
- `src/components/LifelineMap.tsx`: Complete rewrite for orchestration and UI.
- `src/lib/map/routeLayer.ts`: Added support for data-driven styling and text labels.
- `routing_service/main.py`: Updated logic to support `vehicle_capacity` and `vehicle_depots` parameters.
- `routing_service/mock_data_generator.py`: Updated to generate multi-depot test data.

## Next Steps
- Connect the "Demand" values to real-time `water_readings` from PowerSync.
- Implement a UI to dynamically adjust fleet size or constraints.
