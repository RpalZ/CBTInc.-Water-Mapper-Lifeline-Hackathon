

### 1. The Core Objective

* **Goal:** **Vehicle Routing Problem (VRP)**. Even if you start with one truck, you want the system to handle a "fleet" (multiple vehicles) eventually as the project scales.
* **Optimization Factor:** **Total Distance Traveled.** In a hackathon context (and in Sudan), fuel is scarce and expensive. Minimizing distance is the most impactful metric.

### 2. The Fleet & The Depot

* **Number of Vehicles:** Start with a variable parameter (default to **3**). This shows the judges the system is scalable.
* **The Depot:** Use a single central depot (e.g., a main water station or community center).
* **Return Trip:** Yes, the vehicles should return to the depot to refill for the next day.

### 3. The Stops & Tasks

* **Routing Targets:** Use the **`device`** locations (linked to `water_readings`). You only want to route to devices where `pressure_pa` is below a certain threshold (e.g., < 10% full).
* **Task:** Delivery (Water refilling).
* **Demand:** Each stop has a "Demand" equal to the barrel capacity (e.g., **200L**).
* **Service Time:** Assume **15 minutes** per stop for the physical act of refilling and logging the data.
* **Time Windows:** For the MVP, **No**. Keep it simple. Assume all locations are accessible 24/7.

### 4. The "Real World" - Travel Time & Distance

* **Implementation:** **Option A (Simple - Haversine Formula).** * *Why?* Sudan’s road data on Google Maps can be unreliable or non-existent in rural areas. Straight-line distance is the most "offline-first" friendly and robust for a hackathon.
* *Note:* You can apply a "Circuity Factor" (multiplying distance by 1.2 or 1.4) to simulate real-world road bends.



### 5. The Technical Implementation

* **Location:** **Backend (Python Microservice).**
* OR-Tools is natively supported in Python. You can create a small **FastAPI** wrapper.
* Your Next.js app sends the list of "Low Water" IDs to this service.
* The service runs the solver and returns a JSON array of the optimized path: `[id_1, id_5, id_2, id_depot]`.



---

### Suggested Logic Flow for the Solver

To make this actually work with your database, tell your developer to use this logic:

1. **Filter:** `SELECT device_id FROM water_readings WHERE pressure_pa < threshold`.
2. **Join:** Get the `latitude` and `longitude` for those IDs from the `device` or `Locations` table.
3. **Matrix:** Build the  distance matrix using the coordinates.
4. **Solve:** Pass the matrix, the number of vehicles (3), and vehicle capacity (e.g., 2000L) to OR-Tools.
5. **Output:** Return the route to the Next.js frontend to be rendered on a map.

