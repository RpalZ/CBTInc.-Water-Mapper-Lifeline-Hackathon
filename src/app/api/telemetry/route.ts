import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import * as turf from "@turf/turf";

export async function GET(_req: NextRequest) {
    // This endpoint analyzes telemetry data to identify active locations based on usage.
    // Logic:
    // 1. Fetch readings from the last 24 hours.
    // 2. Identify devices with "massive pressure changes" (indicating active water usage).
    // 3. Cluster the coordinates of these active devices to handle GPS drift.
    // 4. Return the centroids of these active clusters.

    try {
        // 1. Fetch data from the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: readings, error } = await supabaseAdmin
            .from('water_readings')
            .select('device_id, pressure_pa, latitude, longitude, recorded_at')
            // .gte('recorded_at', twentyFourHoursAgo)
            .order('recorded_at', { ascending: true });

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!readings || readings.length === 0) {
            return NextResponse.json({ message: "No active readings in the last 24 hours", clusters: [] });
        }

        // 2. Group by device and filter for pressure changes
        const deviceGroups: Record<string, typeof readings> = {};
        readings.forEach(r => {
            if (!deviceGroups[r.device_id]) deviceGroups[r.device_id] = [];
            deviceGroups[r.device_id].push(r);
        });

        const activePoints: any[] = [];
        const PRESSURE_THRESHOLD_PA = 2000; // Define "massive change" threshold (e.g., 2000 Pa ~ 0.2 meters head)

        Object.entries(deviceGroups).forEach(([deviceId, deviceReadings]) => {
            if (deviceReadings.length < 2) return; // Need at least 2 points to see change

            const pressures = deviceReadings.map(r => r.pressure_pa);
            const minP = Math.min(...pressures);
            const maxP = Math.max(...pressures);

            // If pressure fluctuation exceeds threshold, consider it "active"
            if ((maxP - minP) > PRESSURE_THRESHOLD_PA) {
                // Use the latest coordinate for this active device
                const latestReading = deviceReadings[deviceReadings.length - 1];
                if (latestReading.latitude && latestReading.longitude) {
                    activePoints.push(turf.point([latestReading.longitude, latestReading.latitude], {
                        device_id: deviceId,
                        pressure_delta: maxP - minP
                    }));
                }
            }
        });

        if (activePoints.length === 0) {
            return NextResponse.json({ message: "No devices showed significant pressure changes", clusters: [] });
        }

        // 3. DBScan Clustering to handle GPS drift / co-located devices
        // maxDistance: 0.1 km (100m), minPoints: 1 (even a single active device counts)
        const pointCollection = turf.featureCollection(activePoints) as any;
        const clustered = turf.clustersDbscan(pointCollection, 1, { units: 'kilometers', minPoints: 1 });

        // 4. Calculate Centroids for each cluster
        const clusterGroups: Record<number, any[]> = {};
        const noisePoints: any[] = [];

        turf.featureEach(clustered, (currentFeature: any) => {
            const clusterId = currentFeature.properties?.cluster;
            // Ensure we are working with Point features
            if (currentFeature.geometry.type === 'Point') {
                if (clusterId !== undefined) {
                    if (!clusterGroups[clusterId]) clusterGroups[clusterId] = [];
                    clusterGroups[clusterId].push(currentFeature);
                } else {
                    noisePoints.push(currentFeature);
                }
            }
        });

        const centroids = Object.values(clusterGroups).map(features => {
            const fc = turf.featureCollection(features);
            const centroid = turf.centroid(fc);
            const totalDelta = features.reduce((sum, f) => sum + (f.properties?.pressure_delta || 0), 0);
            
            return {
                ...centroid.geometry,
                properties: {
                    device_count: features.length,
                    avg_pressure_delta: totalDelta / features.length,
                    active_devices: features.map(f => f.properties?.device_id)
                }
            };
        });

        // Add noise points (unclustered but active)
        noisePoints.forEach(p => {
            centroids.push({
                type: "Point",
                coordinates: p.geometry.coordinates,
                properties: {
                    device_count: 1,
                    avg_pressure_delta: p.properties?.pressure_delta,
                    active_devices: [p.properties?.device_id]
                }
            });
        });

        return NextResponse.json({
            count: centroids.length,
            clusters: centroids
        });

    } catch (e) {
        console.error("Telemetry processing error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}