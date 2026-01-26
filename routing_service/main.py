from fastapi import FastAPI
from pydantic import BaseModel
import math
from typing import List, Optional
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

# -----------------
# 1. API Models (Request & Response)
# -----------------

class Location(BaseModel):
    """Represents a single geographic point."""
    id: str
    lat: float
    lon: float
    demand: Optional[int] = 200 # Predicted water demand for this location
    optional_visit: bool = False # If true, this location can be skipped (dropped) with a penalty
    drop_penalty: Optional[int] = None # Penalty for dropping this location; if None, a high default is used

class SolveRequest(BaseModel):
    """The request body for the VRP solver."""
    locations: List[Location]
    num_vehicles: int
    depot_index: int # Default depot if vehicle_depots is not provided
    vehicle_depots: Optional[List[int]] = None # Optional: [loc_idx_for_v0, loc_idx_for_v1, ...]
    max_distance_meters: Optional[int] = 50000 # Default 50km if not specified
    vehicle_capacity: Optional[int] = 2000 # Default 2000L capacity per vehicle

class Route(BaseModel):
    """Represents the solved route for a single vehicle."""
    vehicle_id: int
    locations: List[Location]
    total_distance_meters: int

class SolveResponse(BaseModel):
    """The response body containing the optimized routes."""
    routes: List[Route]
    status: str
    dropped_node_ids: Optional[List[str]] = None # IDs of locations that could not be visited

# -----------------
# 2. FastAPI App Initialization
# -----------------

app = FastAPI(
    title="Lifeline Routing Service",
    description="A microservice to solve Vehicle Routing Problems (VRP) using Google OR-Tools.",
)

# -----------------
# 3. Core Logic & Helpers
# -----------------

def haversine_distance(pos1: Location, pos2: Location) -> int:
    """Calculates the Haversine distance between two points in meters."""
    R = 6371000  # Radius of Earth in meters
    lat1, lon1 = math.radians(pos1.lat), math.radians(pos1.lon)
    lat2, lon2 = math.radians(pos2.lat), math.radians(pos2.lon)

    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return int(distance)

# -----------------
# 4. API Endpoint
# -----------------

@app.post("/solve-vrp", response_model=SolveResponse)
def solve_vrp(request: SolveRequest):
    """
    Receives a list of locations and vehicle constraints,
    and returns optimized routes using the Capacitated Vehicle Routing Problem (CVRP) model.
    """
    
    num_locations = len(request.locations)
    
    # 0. Basic Validation
    if num_locations < 2:
         return SolveResponse(routes=[], status="NOT_ENOUGH_LOCATIONS")
    
    depot_index = request.depot_index
    num_vehicles = request.num_vehicles
    
    # --- 1. Create Data Model ---
    
    # A. Calculate Distance Matrix
    # We use integer meters for OR-Tools.
    distance_matrix = []
    for i in range(num_locations):
        row = []
        for j in range(num_locations):
            if i == j:
                row.append(0)
            else:
                dist = haversine_distance(request.locations[i], request.locations[j])
                # Apply circuity factor of 1.2 to simulate real road curvature
                row.append(int(dist * 1.2))
        distance_matrix.append(row)

    # B. Define Demands
    # Use demand from location if provided, else default to 200 units (e.g. Liters).
    demands = [0] * num_locations
    for i in range(num_locations):
        if i == depot_index:
            demands[i] = 0
        else:
            demands[i] = request.locations[i].demand if request.locations[i].demand is not None else 200
    
    # C. Define Vehicle Capacities
    # Use capacity from request or default
    vehicle_capacities = [request.vehicle_capacity] * num_vehicles

    # --- 2. Create Routing Index Manager ---
    if request.vehicle_depots and len(request.vehicle_depots) == num_vehicles:
        # Multi-Depot Mode: Each vehicle has its own start/end node
        starts = request.vehicle_depots
        ends = request.vehicle_depots
        manager = pywrapcp.RoutingIndexManager(
            num_locations, num_vehicles, starts, ends
        )
    else:
        # Single Depot Mode: All vehicles start/end at depot_index
        manager = pywrapcp.RoutingIndexManager(
            num_locations, num_vehicles, depot_index
        )

    # --- 3. Create Routing Model ---
    routing = pywrapcp.RoutingModel(manager)

    # --- 4. Register Transit Callback (Distance) ---
    def distance_callback(from_index, to_index):
        # Convert from routing variable Index to distance matrix NodeIndex.
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    
    # Define cost of each arc.
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # --- 5. Add Distance Constraint (Fuel/Scarcity) ---
    routing.AddDimension(
        transit_callback_index,
        0,  # no slack
        request.max_distance_meters,  # vehicle maximum travel distance
        True,  # start cumul to zero
        "Distance",
    )

    # --- 6. Add Capacity Constraint ---
    def demand_callback(from_index):
        # Convert from routing variable Index to demands NodeIndex.
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        vehicle_capacities,  # vehicle maximum capacities
        True,  # start cumul to zero
        "Capacity",
    )

    # --- 7. Add Disjunctions for Optional Visits (Urgency Penalties) ---
    # Locations marked as optional can be dropped with a penalty.
    # Locations not marked as optional are mandatory.
    for i, loc in enumerate(request.locations):
        if i == depot_index:
            continue # Depot cannot be dropped

        if loc.optional_visit:
            # Use provided penalty or a high default (e.g., 100x max distance)
            penalty = loc.drop_penalty if loc.drop_penalty is not None else max(distance_matrix[depot_index]) * 100
            routing.AddDisjunction([manager.NodeToIndex(i)], penalty)

    # --- 8. Configure Search Parameters ---
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    # Use PATH_CHEAPEST_ARC for a good initial solution
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    # Use GUIDED_LOCAL_SEARCH to refine the solution
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.FromSeconds(2) # Keep it snappy for the MVP

    # --- 9. Solve ---
    solution = routing.SolveWithParameters(search_parameters)

    # --- 10. Parse Solution ---
    if not solution:
        return SolveResponse(routes=[], status="NO_SOLUTION_FOUND")

    final_routes = []
    dropped_node_ids = []

    # Identify dropped nodes from the solution
    for node in range(routing.Size()):
        # Skip depot
        if routing.IsStart(node) or routing.IsEnd(node):
            continue
        # If a node's next stop is itself, it was dropped.
        if solution.Value(routing.NextVar(node)) == node:
            location_index = manager.IndexToNode(node)
            dropped_node_ids.append(request.locations[location_index].id)
    
    # Create routes for each vehicle
    for vehicle_id in range(num_vehicles):
        index = routing.Start(vehicle_id)
        route_locations = []
        route_distance = 0
        
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            route_locations.append(request.locations[node_index])
            
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            route_distance += routing.GetArcCostForVehicle(
                previous_index, index, vehicle_id
            )
            
        # Add the end node (depot)
        node_index = manager.IndexToNode(index)
        route_locations.append(request.locations[node_index])
        
        # Only include routes that actually visit customers
        if len(route_locations) > 2:
             final_routes.append(Route(
                vehicle_id=vehicle_id,
                locations=route_locations,
                total_distance_meters=route_distance
            ))

    status = "OPTIMAL" if not dropped_node_ids else "SOLUTION_WITH_DROPPED_NODES"
    return SolveResponse(routes=final_routes, status=status, dropped_node_ids=dropped_node_ids)