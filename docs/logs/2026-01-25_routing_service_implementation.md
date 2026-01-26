# Routing Service Implementation - 2026-01-25

## Summary
Implemented a Python microservice using **FastAPI** and **Google OR-Tools** to solve the Vehicle Routing Problem (VRP) for the Lifeline project. This service takes a list of locations and returns optimized routes for a fleet of vehicles, minimizing total travel distance.

## Key Features
- **Algorithm:** Uses the Capacitated Vehicle Routing Problem (CVRP) model.
- **Distance Metric:** Haversine formula (Great Circle Distance) with a 1.2x "circuity factor" to simulate real-world road curvature without external API dependencies.
- **Constraints:**
    - **Demand:** 200 units per stop (simulated delivery/pickup).
    - **Capacity:** 2000 units per vehicle.
    - **Fleet:** Configurable number of vehicles.
- **API:** RESTful `POST /solve-vrp` endpoint accepting JSON.

## Files Created
- `routing_service/main.py`: Core logic and API definition.
- `routing_service/requirements.txt`: Python dependencies (`fastapi`, `uvicorn`, `ortools`).
- `routing_service/README.md`: Instructions for running the service.
- `ROUTING_IMPLEMENTATION_TODO.md`: Implementation checklist.

## Next Steps
- Integrate the frontend (Next.js) to call this service.
- Deploy the service (e.g., to a Supabase Edge Function or a separate container).
