import { NextRequest, NextResponse } from "next/server";
import { generateRawTelemetry } from "@/lib/telemetry/dataGenerator";
import { assignLocationsToBatch, TelemetryWithLocation } from "@/lib/telemetry/locationAssignment";
import * as turf from "@turf/turf";
import { supabaseAdmin as supabase } from "@/lib/supabaseServer"; 

// Type for the ML request payload
interface PredictionRequest {
    prev_day_l: number;
    pressure_pa: number;
    device_id_count: number;
    day_of_week: number;
}

export async function POST(req: NextRequest) {
    try {
        console.log("Starting Cron Job: Water Demand Prediction");

        // 1. Generate Raw Data
        const rawData = generateRawTelemetry(500); // Generate 500 points for better clustering
        
        // 2. Assign Locations
        const locationData = assignLocationsToBatch(rawData as TelemetryWithLocation[]);

        // 3. In-Memory Clustering (Centroid Logic)
        // Filter active points (pressure > 2000 delta, stationary) - similar to process-csv
        const activeRecords = locationData.filter(r => 
            (r.pressure_delta || 0) > 2000 && 
            (r.speed_mps || 0) < 1.5 &&
            r.location_id // Only process points that mapped to a known community
        );

        if (activeRecords.length === 0) {
            return NextResponse.json({ message: "No active records found." });
        }

        // Group by location_id (Community)
        const communityGroups: Record<string, typeof activeRecords> = {};
        activeRecords.forEach(r => {
            if (r.location_id) {
                if (!communityGroups[r.location_id]) communityGroups[r.location_id] = [];
                communityGroups[r.location_id].push(r);
            }
        });

        const results = [];

        // 4. Process Each Community / Cluster
        for (const [locId, records] of Object.entries(communityGroups)) {
            // A. Prepare Features for ML
            // We need: prev_day_l, pressure_pa, device_id (count), day_of_week
            
            // Calculate averages/sums from current batch (simulating "today")
            const avgPressure = records.reduce((sum, r) => sum + r.pressure_pa, 0) / records.length;
            const uniqueDevices = new Set(records.map(r => r.device_id)).size;
            
            // For 'prev_day_l', we simulate it using the 'dispensed_l' from this batch as a proxy 
            // (or fetch historical from DB if we were fully rigorous). 
            // For this MVP, we sum dispensed_l from the generated batch.
            const totalDispensed = records.reduce((sum, r) => sum + (r.dispensed_l || 0), 0);
            
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0-6

            // B. Call ML Prediction Endpoint
            const mlPayload = {
                prev_day_l: totalDispensed, // Using current as proxy for 'previous' context or lag
                pressure_pa: avgPressure,
                device_id_count: uniqueDevices,
                day_of_week: dayOfWeek
            };

            let predictedDemand = 0;
            try {
                // Assuming routing_service is running locally on port 8000
                // In production, use env var for URL
                const response = await fetch("http://127.0.0.1:8000/predict-demand", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(mlPayload)
                });

                if (response.ok) {
                    const data = await response.json();
                    predictedDemand = data.predicted_demand_l;
                } else {
                    console.error(`ML Service Error for ${locId}:`, await response.text());
                }
            } catch (err) {
                console.error(`Failed to reach ML service for ${locId}:`, err);
            }

            // C. Update Supabase
            // We need to find the UUID of the location based on the 'name' (which matches loc_XXX id in our mapping)
            // Assuming 'name' in 'location' table corresponds to 'loc_001', etc.
            
            // First, check if location exists by name
            const { data: locData, error: locError } = await supabase
                .from('location')
                .select('id')
                .eq('name', locId)
                .single();

            let updateStatus = "skipped";
            
            if (locData) {
                const { error: updateError } = await supabase
                    .from('location')
                    .update({ water_demand_daily: predictedDemand })
                    .eq('id', locData.id);
                
                if (!updateError) {
                    updateStatus = "updated";
                } else {
                    updateStatus = `error_update: ${updateError.message}`;
                }
            } else {
                // Location doesn't exist, insert it
                
                // 1. Calculate Centroid for the new location
                // Convert records to Turf points
                const points = records.map(r => turf.point([r.lon, r.lat]));
                const featureCollection = turf.featureCollection(points);
                const centroid = turf.centroid(featureCollection);
                const [centroidLon, centroidLat] = centroid.geometry.coordinates;

                const { error: insertError } = await supabase
                    .from('location')
                    .insert({
                        name: locId,
                        latitude: centroidLat,
                        longitude: centroidLon,
                        label: 'community', // Default label
                        water_demand_daily: predictedDemand,
                        // owner is nullable, so we skip it
                    });

                if (!insertError) {
                    updateStatus = "inserted";
                } else {
                    updateStatus = `error_insert: ${insertError.message}`;
                }
            }

            results.push({
                location: locId,
                features: mlPayload,
                prediction: predictedDemand,
                db_status: updateStatus
            });
        }

        return NextResponse.json({
            success: true,
            processed_communities: Object.keys(communityGroups).length,
            details: results
        });

    } catch (e: any) {
        console.error("Cron job failed:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}