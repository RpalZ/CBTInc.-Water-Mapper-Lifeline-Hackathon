# Routing Logic Update: User Data Integration

**Date:** 2026-01-29

## Summary
Updated the routing engine and frontend map component to incorporate user-created data (locations and vehicles) from the local database into the route optimization process. This allows the application to move beyond hardcoded simulations and solve real-world scenarios defined by the user.

## Changes

### 1. Routing Service (`routing_service/main.py`)
- **Mixed Fleet Support:** Modified the `solve_vrp` endpoint to respect the `vehicle_capacities` list if provided in the `SolveRequest`.
- **Logic:** Previously, the solver defaulted to a single uniform capacity for all vehicles. It now checks for a list of capacities matching the fleet size, enabling the modeling of mixed fleets (e.g., small cars vs. large trucks).

### 2. Frontend Map (`src/components/LifelineMap.tsx`)
- **Data Aggregation in `handleGenerateRoutes`:**
  - The routing request now constructs a comprehensive `locations` payload combining:
    1.  **Hardcoded Depots:** Permanent infrastructure nodes.
    2.  **Simulation Communities:** `COMMUNITY_COORDS` (kept for demo purposes).
    3.  **User Locations:** Active records from the `location` table in the local SQLite database (PowerSync).
  - Logic ensures ID uniqueness and correctly maps user-defined "Depots" vs "Communities" to solver constraints (demand vs. supply).

- **Dynamic Fleet Configuration:**
  - **Combined Fleets:** The system now combines a "Mock Fleet" (20 vehicles) with the user's "DB Fleet" (if any).
  - **Mock Fleet:** 20 vehicles with varied capacities (cycling 5000L, 3000L, 1000L) distributed across hardcoded depots.
  - **DB Fleet:** User-created vehicles with their specific capacities and assigned depots.
  - **Result:** The solver receives a merged list of capacities and depot assignments, optimizing for the entire available fleet.

- **Visualization:**
  - Updated the route rendering loop to resolve labels dynamically based on the source of the location ID (Depot vs. Community vs. User-defined Name).

- **Code Quality:**
  - Resolved linting warnings related to unused variables in `catch` blocks.

## Impact
Users can now add real locations and vehicles via the UI, and the "Route" button will generate optimized paths specifically for their defined fleet and communities, taking into account individual vehicle capacities and depot assignments. The inclusion of the mock fleet ensures the map is always populated with rich data for demonstration purposes, even with minimal user input.