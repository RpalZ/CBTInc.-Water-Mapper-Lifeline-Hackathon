# Routing Service Update - 2026-01-25

## Summary
Updated the Routing Service to include a **Maximum Distance** constraint per vehicle, as requested in `PRP4.md`. This is crucial for fuel scarcity scenarios in Sudan.

## Changes
- **API:** Added `max_distance_meters` to the `SolveRequest` model (defaults to 50,000m).
- **Solver:** Added a "Distance" dimension to the OR-Tools model to enforce the maximum travel limit for each vehicle.
- **Documentation:** Updated `ROUTING_IMPLEMENTATION_TODO.md` to reflect the new constraint.

## Details
The solver now ensures that no single vehicle exceeds the specified `max_distance_meters` in its route. If a solution cannot be found within these constraints, the API returns a `NO_SOLUTION_FOUND` status.
