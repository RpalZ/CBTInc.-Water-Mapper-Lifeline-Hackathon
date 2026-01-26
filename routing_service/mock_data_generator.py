# routing_service/mock_data_generator.py
# This file generates mock data for testing the OR-Tools routing service.
# DELETE THIS FILE AND ITS USAGE WHEN ACTUAL DATA IS AVAILABLE.

import random
from typing import List, Dict

from main import Location, SolveRequest # Import Pydantic models from main.py

def generate_mock_request(
    num_customers: int = 10,
    num_vehicles: int = 4,
    num_depots: int = 2, # New: Number of depots
    depot_lat: float = 15.5007, # Khartoum
    depot_lon: float = 32.5596,
    max_demand_per_customer: int = 300,
    min_demand_per_customer: int = 50,
    max_lat_offset: float = 2.0, # Increased offset for wider spread
    max_lon_offset: float = 2.0,
    max_distance_meters: int = 2000000, # 2000km
    vehicle_capacity: int = 2500
) -> SolveRequest:
    """
    Generates a mock SolveRequest object for testing the VRP solver.
    """
    all_locations: List[Location] = []

    # Generate Depots
    # We'll spread them out a bit
    for i in range(num_depots):
        offset_lat = (i * 2.0) # Simple offset
        offset_lon = (i * 2.0)
        depot_location = Location(
            id=f"depot_{i}", 
            lat=depot_lat + offset_lat, 
            lon=depot_lon + offset_lon, 
            demand=0,
            optional_visit=False
        )
        all_locations.append(depot_location)

    # Assign Vehicles to Depots
    # Distribute vehicles evenly among depots
    vehicle_depots = []
    for v in range(num_vehicles):
        vehicle_depots.append(v % num_depots)

    # Add Customer Locations
    for i in range(num_customers):
        # Generate random offsets
        lat_offset = random.uniform(-max_lat_offset, max_lat_offset)
        lon_offset = random.uniform(-max_lon_offset, max_lon_offset)
        
        customer_lat = depot_lat + lat_offset
        customer_lon = depot_lon + lon_offset
        
        customer_demand = random.randint(min_demand_per_customer, max_demand_per_customer)
        is_optional = random.random() < 0.2
        
        customer_location = Location(
            id=f"customer_{i+1}",
            lat=customer_lat,
            lon=customer_lon,
            demand=customer_demand,
            optional_visit=is_optional,
            drop_penalty=15000 if is_optional else None
        )
        all_locations.append(customer_location)

    # Create the SolveRequest
    mock_request = SolveRequest(
        locations=all_locations,
        num_vehicles=num_vehicles,
        depot_index=0, # Fallback
        vehicle_depots=vehicle_depots,
        max_distance_meters=max_distance_meters,
        vehicle_capacity=vehicle_capacity
    )
    
    return mock_request

if __name__ == "__main__":
    mock_data = generate_mock_request(
        num_customers=20,
        num_vehicles=4,
        num_depots=2
    )
    
    print("--- Generated Mock SolveRequest (JSON format) ---")
    print(mock_data.model_dump_json(indent=2))
    print("\n--- To test, run the FastAPI service and use a tool like curl or Postman: ---")
    print("curl -X POST -H \"Content-Type: application/json\" \\")
    print("  -d '" + mock_data.model_dump_json() + "' \\")
    print("  http://localhost:8000/solve-vrp")
