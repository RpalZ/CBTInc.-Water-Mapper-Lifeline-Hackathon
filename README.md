# 💧 WaterMapper Lifeline: Autonomous Crisis Logistics

**WaterMapper Lifeline** is an offline-first, AI-powered logistics platform designed to optimize water distribution in crisis zones like Sudan. It combines real-time sensor data, predictive demand modeling, and advanced vehicle routing to ensure critical resources reach the communities that need them most—even without internet connectivity.

![Project Status](https://img.shields.io/badge/Status-Active_Development-green)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js_|_PowerSync_|_Python_|_OR--Tools-blue)

---

## 🚀 Key Features

### 1. 🌍 Local-First PWA (Offline Capability)
Built for unreliable networks. The entire application runs directly on the user's device.
- **PowerSync & SQLite:** Data is stored locally in the browser via OPFS (Origin Private File System) and syncs with the cloud only when a connection is available.
- **Serwist:** Service worker management ensures the app loads instantly, offline.
- **MapLibre:** Vector maps are rendered client-side using cached PMTiles, allowing navigation without a live map server.

### 2. 📊 Data-Driven Demand (ML Ready)
- **Sensor Integration:** Designed to ingest telemetry from IoT water tank sensors (`pressure_pa`, `timestamp`,`location`, etc), whcich is used to find other variables such as last 24 hour demand in specific locations.
- **Demand Prediction:** Uses historical usage patterns to forecast liters required per community in the next 24 hours, replacing reactive "emergency calls" with proactive delivery schedules.

### 3. 🗺️ Hybrid Routing Visualization
- **Backend Planner:** Google OR-Tools calculates the optimal *sequence* of stops using the demand predicted by the machine learning model.
- **Frontend Visualizer:** The React app fetches real-world road geometries from OSRM (Open Source Routing Machine) to display turn-by-turn paths on the map.
- **Interactive Dashboard:** Operators can filter vehicles, view demand scoreboards, and identify critical shortages instantly.

### 4. 🚛 Advanced Fleet Optimization (OR-Tools)
A dedicated Python microservice that solves the **Multi-Depot Capacitated Vehicle Routing Problem (MDVRP)**.
- **Constraint Programming:** Considers vehicle capacity (Liters), maximum fuel range (km), and community demand urgency.
- **Multi-Depot:** Optimizes fleets operating simultaneously from Khartoum, Port Sudan, El Obeid, and Nyala.
- **Resilience:** Uses soft constraints to "do the best possible" rather than failing if resources are tight (no "No Solution" errors).

---

## 🛠️ Technical Architecture

### Frontend (Next.js 15)
- **Framework:** Next.js App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Map Engine:** MapLibre GL JS + PMTiles
- **State/Sync:** `@powersync/react`

### Backend & Data
- **Database:** Supabase (PostgreSQL)
- **Sync Engine:** PowerSync Service
- **Optimization Service:** Python (FastAPI) + Google OR-Tools
- **Routing API:** OSRM (Public/Self-hosted)

### Optimization Logic Flow
1.  **Input:** Frontend gathers community locations and predicted demands.
2.  **Request:** Next.js Proxy (`/api/routing/solve`) forwards data to Python Service.
3.  **Solve:** Python Service (`/solve-vrp`) runs OR-Tools algorithms to minimize total distance.
4.  **Response:** Optimized stop sequences returned to Frontend.
5.  **Render:** Frontend fetches road segments from OSRM and draws the fleet plan.

### Machine Learning & Analytics

- **Model:** Random Forest Regressor (Scikit-Learn)
- **Serialization:** Joblib (`.pkl`)
- **Metrics:** MSE, MAE

#### Features
- `location_encoded` — Encoded location ID  
- `prev_day_l` — Previous-day consumption (liters)  
- `pressure_pa` — Daily avg pressure (Pa)  
- `device_id` — Meter identifier  
- `day_of_week` — Extracted from timestamp  

#### ML Logic Flow
1. **Feature Engineering:** Encode locations, extract day of week, generate `prev_day_l`, aggregate daily telemetry.
2. **Training:** Train Random Forest on daily aggregates, optimizing MAE and tracking MSE.
3. **Inference:** Generate 24h per-location demand forecasts from latest snapshots for routing.

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase Account
- PowerSync Account

### 1. Clone & Install Frontend
```bash
git clone https://github.com/your-repo/water-mapper.git
cd water-mapper
npm install
```

### 2. Configure Environment
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
NEXT_PUBLIC_POWERSYNC_URL=your_powersync_url
ROUTING_SERVICE_URL=http://localhost:5000/solve-vrp
```

### 3. Start the Optimization Engine (Python)
Navigate to the service directory:
```bash
cd routing_service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
```

### 4. Start the Application
In the root directory:
```bash
npm run dev
```
Open `http://localhost:3000` to see the WaterMapper Dashboard.

---

## 📂 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components (LifelineMap, etc.)
│   ├── lib/
│   │   ├── map/             # MapLibre & Layer helpers
│   │   ├── routing/         # OSRM & Route Source logic
│   │   └── powersync/       # Database Schema & Connectors
├── routing_service/         # Python Microservice (OR-Tools)
│   ├── main.py              # FastAPI application & Solver logic
│   └── mock_data...         # Test data generators
├── supabase/                # SQL Migrations
└── docs/                    # Detailed architectural documentation
```

## 🤝 Contributing
Contributions are welcome! Please check the `docs/` folder for detailed implementation guides on Routing, Database, and Maps.

---

*CBT Inc. — Builting the future of humanitarian logistics.*
