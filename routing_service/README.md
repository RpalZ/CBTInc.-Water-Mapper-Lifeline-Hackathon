# Lifeline Routing Service

This microservice uses **Google OR-Tools** to solve the Vehicle Routing Problem (VRP) for water distribution trucks.

## Setup

1.  **Create a virtual environment (optional but recommended):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Running the Service

Start the FastAPI server:

```bash
uvicorn main:app --reload --port 5000
```

The API will be available at `http://localhost:8000`.

## API Usage

### Endpoint: `POST /solve-vrp`

**Request Body:**

```json
{
  "locations": [
    {"id": "depot", "lat": 25.319, "lon": 51.528},
    {"id": "loc1", "lat": 25.320, "lon": 51.530},
    {"id": "loc2", "lat": 25.322, "lon": 51.535}
  ],
  "num_vehicles": 3,
  "depot_index": 0
}
```

**Response:**

```json
{
  "routes": [
    {
      "vehicle_id": 0,
      "locations": [ ... ],
      "total_distance_meters": 1500
    }
  ],
  "status": "OPTIMAL"
}
```
