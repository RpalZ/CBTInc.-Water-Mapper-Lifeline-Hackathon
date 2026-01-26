# routing_service/mock_data_generator.py
# This file generates mock data for testing the OR-Tools routing service.
# DELETE THIS FILE AND ITS USAGE WHEN ACTUAL DATA IS AVAILABLE.

import random
from typing import List, Dict

from main import Location, SolveRequest # Import Pydantic models from main.py

def generate_mock_request(
    num_customers: int = 10,
    num_vehicles: int = 3,
    depot_lat: float = 15.5007, # Example: Khartoum, Sudan
    depot_lon: float = 32.5596,
    max_demand_per_customer: int = 300, # Max predicted water demand
    min_demand_per_customer: int = 50,
    max_lat_offset: float = 0.05, # Max degrees offset from depot for customers
    max_lon_offset: float = 0.05,
    max_distance_meters: int = 50000 # Max 50km for vehicles
) -> SolveRequest:
    """
    Generates a mock SolveRequest object for testing the VRP solver.
    This data is purely for development and testing.
    """
    all_locations: List[Location] = []

    # Add Depot Location
    depot_location = Location(id="depot", lat=depot_lat, lon=depot_lon, demand=0)
    all_locations.append(depot_location)
    depot_index = 0 # Depot is always the first location

    # Add Customer Locations
    for i in range(num_customers):
        # Generate random offsets for latitude and longitude
        lat_offset = random.uniform(-max_lat_offset, max_lat_offset)
        lon_offset = random.uniform(-max_lon_offset, max_lon_offset)
        
        customer_lat = depot_lat + lat_offset
        customer_lon = depot_lon + lon_offset
        
        # Generate random demand for each customer
        customer_demand = random.randint(min_demand_per_customer, max_demand_per_customer)
        
        # Decide if this visit is optional (e.g., 30% chance)
        is_optional = random.random() < 0.3
        
        customer_location = Location(
            id=f"customer_{i+1}",
            lat=customer_lat,
            lon=customer_lon,
            demand=customer_demand,
            optional_visit=is_optional,
            # Assign a penalty only if the visit is optional
            drop_penalty=random.randint(10000, 20000) if is_optional else None
        )
        all_locations.append(customer_location)

    # Create the SolveRequest
    mock_request = SolveRequest(
        locations=all_locations,
        num_vehicles=num_vehicles,
        depot_index=depot_index,
        max_distance_meters=max_distance_meters
    )
    
    return mock_request

if __name__ == "__main__":
    # Example usage: Generate a request with 15 customers and 4 vehicles
    mock_data = generate_mock_request(
        num_customers=15,
        num_vehicles=4,
        depot_lat=15.5007, # Khartoum, Sudan
        depot_lon=32.5596,
        max_distance_meters=60000 # Example: 60km max route for each vehicle
    )
    
    print("--- Generated Mock SolveRequest (JSON format) ---")
    print(mock_data.model_dump_json(indent=2))
    print("\n--- To test, run the FastAPI service and use a tool like curl or Postman: ---")
    print("curl -X POST -H \"Content-Type: application/json\" \\")
    print("  -d '" + mock_data.model_dump_json() + "' \\")
    print("  http://localhost:8000/solve-vrp")
