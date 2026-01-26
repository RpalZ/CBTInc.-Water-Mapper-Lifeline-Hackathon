# Routing Service Fix: Dropped Nodes Logic - 2026-01-25

## Summary
Fixed an `AttributeError` in the Python routing service that occurred when attempting to check for dropped nodes. The previous implementation used an incorrect method (`routing.IsDropped`) on the `RoutingModel` object.

## Changes
- **Error Source:** The method `routing.IsDropped` was incorrectly used. The correct approach to identify dropped nodes is to inspect the `solution` object directly: if `solution.Value(routing.NextVar(node_index)) == node_index`, the node was dropped.
- **`SolveResponse` Model Update:** Added `dropped_node_ids: Optional[List[str]]` to the `SolveResponse` Pydantic model to explicitly return the IDs of any unvisited optional locations.
- **Solver Logic Update:** Modified the "Parse Solution" block in `routing_service/main.py` to:
    - Properly identify dropped nodes using `solution.Value(routing.NextVar(node))` logic.
    - Collect these dropped node IDs.
    - Return them in the `SolveResponse`, along with an updated `status` (e.g., "SOLUTION_WITH_DROPPED_NODES").

## Impact
The routing service now correctly handles optional visits and reports which locations could not be served due to constraints, providing more accurate and actionable results. The `500 Internal Server Error` related to this `AttributeError` should now be resolved.
