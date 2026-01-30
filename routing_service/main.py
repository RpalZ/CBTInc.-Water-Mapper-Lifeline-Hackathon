from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import math
from typing import List, Optional
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import joblib
import pandas as pd
import os

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
    vehicle_capacities: Optional[List[int]] = None # Optional: [cap_for_v0, cap_for_v1, ...]

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

class PredictionRequest(BaseModel):
    """Request body for water demand prediction."""
    prev_day_l: float
    pressure_pa: float
    device_id_count: int
    day_of_week: int # 0=Monday, 6=Sunday

class PredictionResponse(BaseModel):
    """Response body for water demand prediction."""
    predicted_demand_l: float

# -----------------
# 2. FastAPI App Initialization
# -----------------

app = FastAPI(
    title="Lifeline Routing Service",
    description="A microservice to solve Vehicle Routing Problems (VRP) using Google OR-Tools and predict water demand.",
)

# Load ML Model
MODEL_PATH = "water_demand_model.pkl"
FEATURES_PATH = "model_features.pkl"
model = None
model_features = None

if os.path.exists(MODEL_PATH) and os.path.exists(FEATURES_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        model_features = joblib.load(FEATURES_PATH)
        print(f"ML Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading ML model: {e}")
else:
    print(f"Warning: ML model files not found at {MODEL_PATH} or {FEATURES_PATH}")

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

@app.post("/predict-demand", response_model=PredictionResponse)
def predict_demand(request: PredictionRequest):
    """
    Predicts water demand based on historical data features.
    """
    if model is None or model_features is None:
        raise HTTPException(status_code=503, detail="ML Model not available")

    try:
        input_data = {
            'prev_day_l': [request.prev_day_l],
            'pressure_pa': [request.pressure_pa],
            'device_id': [request.device_id_count],
            'day_of_week': [request.day_of_week]
        }
        
        input_df = pd.DataFrame(input_data)
        
        if isinstance(model_features, list):
             input_df = input_df[model_features]

        prediction = model.predict(input_df)[0]
        
        return PredictionResponse(predicted_demand_l=round(float(prediction), 2))

    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/solve-vrp", response_model=SolveResponse)
def solve_vrp(request: SolveRequest):
    """
    Receives a list of locations and vehicle constraints,
    and returns optimized routes using the Capacitated Vehicle Routing Problem (CVRP) model.
    """
    
    num_locations = len(request.locations)
    if num_locations < 2:
         return SolveResponse(routes=[], status="NOT_ENOUGH_LOCATIONS")
    
    depot_index = request.depot_index
    num_vehicles = request.num_vehicles
    
    # A. Calculate Distance Matrix
    distance_matrix = []
    for i in range(num_locations):
        row = []
        for j in range(num_locations):
            if i == j:
                row.append(0)
            else:
                dist = haversine_distance(request.locations[i], request.locations[j])
                row.append(int(dist * 1.2))
        distance_matrix.append(row)

    # B. Define Demands
    demands = [0] * num_locations
    for i in range(num_locations):
        demands[i] = request.locations[i].demand if request.locations[i].demand is not None else 200
    
    # C. Define Vehicle Capacities
    if request.vehicle_capacities and len(request.vehicle_capacities) == num_vehicles:
        vehicle_capacities = request.vehicle_capacities
    else:
        vehicle_capacities = [request.vehicle_capacity] * num_vehicles

    # D. Create Routing Index Manager
    if request.vehicle_depots and len(request.vehicle_depots) == num_vehicles:
        starts = request.vehicle_depots
        ends = request.vehicle_depots
        manager = pywrapcp.RoutingIndexManager(num_locations, num_vehicles, starts, ends)
    else:
        manager = pywrapcp.RoutingIndexManager(num_locations, num_vehicles, depot_index)

    # E. Create Routing Model
    routing = pywrapcp.RoutingModel(manager)

    # F. Distance Callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # G. Distance Dimension
    routing.AddDimension(
        transit_callback_index,
        0,  # no slack
        request.max_distance_meters,
        True,  # start cumul to zero
        "Distance",
    )

    # H. Capacity Dimension
    def demand_callback(from_index):
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

    # I. Disjunctions (Optional Visits)
    protected_indices = {depot_index}
    if request.vehicle_depots:
        protected_indices.update(request.vehicle_depots)

    for i, loc in enumerate(request.locations):
        if i in protected_indices:
            continue 

        if loc.optional_visit:
            # Use high penalty for communities, 0 for unused depots
            penalty = loc.drop_penalty if loc.drop_penalty is not None else 10000000
            routing.AddDisjunction([manager.NodeToIndex(i)], int(penalty))

    # J. Search Parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.FromSeconds(5)

    # K. Solve
    solution = routing.SolveWithParameters(search_parameters)

    # L. Parse Solution
    if not solution:
        return SolveResponse(routes=[], status="NO_SOLUTION_FOUND")

    final_routes = []
    dropped_node_ids = []

    for i in range(num_locations):
        if i in protected_indices:
            continue
        idx = manager.NodeToIndex(i)
        if idx != -1 and solution.Value(routing.NextVar(idx)) == idx:
            dropped_node_ids.append(request.locations[i].id)
    
    for vehicle_id in range(num_vehicles):
        index = routing.Start(vehicle_id)
        route_locations = []
        route_distance = 0
        
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            route_locations.append(request.locations[node_index])
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            route_distance += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)
            
        route_locations.append(request.locations[manager.IndexToNode(index)])
        
        if len(route_locations) > 2:
             final_routes.append(Route(
                vehicle_id=vehicle_id,
                locations=route_locations,
                total_distance_meters=route_distance
            ))

    status = f"SOLVED (Routes: {len(final_routes)}, Dropped: {len(dropped_node_ids)})"
    return SolveResponse(routes=final_routes, status=status, dropped_node_ids=dropped_node_ids)
