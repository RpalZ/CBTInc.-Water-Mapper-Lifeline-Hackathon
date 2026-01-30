
import { NextRequest, NextResponse } from "next/server";
import * as turf from "@turf/turf";
import fs from "fs";
import path from "path";

// Helper to parse CSV manually since no library is present
function parseCSV(csvText: string) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const entry: Record<string, any> = {};
        headers.forEach((h, i) => {
            let val = values[i]?.trim();
            // Attempt to parse numbers
            if (val && !isNaN(Number(val))) {
                entry[h] = Number(val);
            } else {
                entry[h] = val;
            }
        });
        return entry;
    });
}

// Helper to convert objects back to CSV
function toCSV(data: any[]) {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            return val === null || val === undefined ? "" : val; // Handle nulls
        });
        csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
}

export async function GET(_req: NextRequest) {
    try {
        const inputFilePath = path.join(process.cwd(), 'ml/data stuff/augmented_telemetry_filtered_with_location.csv');
        const outputJsonPath = path.join(process.cwd(), 'ml/data stuff/filtered_centroids.json');
        const outputCsvPath = path.join(process.cwd(), 'ml/data stuff/filtered_centroids.csv');

        // 1. Read CSV
        if (!fs.existsSync(inputFilePath)) {
            return NextResponse.json({ error: `Input file not found at ${inputFilePath}` }, { status: 404 });
        }
        const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
        const records = parseCSV(fileContent);

        // 2. Filter for significant pressure changes
        // Using existing pressure_delta column. Threshold 2000 Pa.
        // Also ensure valid lat/lon and low speed (stationary).
        const activeRecords = records.filter(r => 
            r.pressure_delta > 2000 && 
            !isNaN(r.lat) && 
            !isNaN(r.lon) &&
            (!r.speed_mps || r.speed_mps < 1.5)
        );

        if (activeRecords.length === 0) {
            return NextResponse.json({ message: "No active records found matching criteria." });
        }

        // 3. Convert to Turf points for clustering
        const points = activeRecords.map((r, index) => 
            turf.point([r.lon, r.lat], { ...r, _originalIndex: index })
        );
        const featureCollection = turf.featureCollection(points);

        // 4. DBScan Clustering
        // maxDistance: 15 km, minPoints: 1
        const radius = 15
        const clustered = turf.clustersDbscan(featureCollection, radius, { units: 'kilometers', minPoints: 1 });

        // Group features by cluster ID
        const clusterGroups: Record<number, any[]> = {};
        const noisePoints: any[] = []; // Points treated as their own cluster

        turf.featureEach(clustered, (currentFeature: any) => {
            const props = currentFeature.properties;
            const clusterId = props.cluster;

            if (clusterId !== undefined) {
                if (!clusterGroups[clusterId]) clusterGroups[clusterId] = [];
                clusterGroups[clusterId].push(currentFeature);
            } else {
                noisePoints.push(currentFeature);
            }
        });

        // 5. Process Clusters (Centroid + Option A Representative)
        const finalResults: any[] = [];

        const processGroup = (features: any[]) => {
            // A. Calculate Geometric Centroid
            const fc = turf.featureCollection(features);
            const centroid = turf.centroid(fc);
            const [centroidLon, centroidLat] = centroid.geometry.coordinates;

            // B. Find Representative (Max pressure_delta) - Option A
            // We sort descending by pressure_delta and take the first one.
            features.sort((a, b) => b.properties.pressure_delta - a.properties.pressure_delta);
            const representative = features[0];

            // C. Construct Result Row
            // Use all columns from representative, but REPLACE lat/lon with centroid
            const resultRow = { ...representative.properties };
            
            // Remove internal tracking props
            delete resultRow.cluster;
            delete resultRow.dbscan;
            delete resultRow._originalIndex;

            // Update Lat/Lon to Centroid
            resultRow.lat = centroidLat;
            resultRow.lon = centroidLon;

            // Optional: Add cluster metadata if useful, or keep strictly original columns + centroid location
            // resultRow.cluster_size = features.length; 

            finalResults.push(resultRow);
        };

        // Process actual clusters
        Object.values(clusterGroups).forEach(processGroup);

        // Process noise points (treated as single-point clusters)
        noisePoints.forEach(p => processGroup([p]));

        // 6. Write Outputs
        
        // Write JSON
        fs.writeFileSync(outputJsonPath, JSON.stringify(finalResults, null, 2));

        // Write CSV
        const csvOutput = toCSV(finalResults);
        fs.writeFileSync(outputCsvPath, csvOutput);

        return NextResponse.json({
            message: "Processing complete",
            total_input_rows: records.length,
            filtered_active_rows: activeRecords.length,
            clusters_found: finalResults.length,
            output_json: outputJsonPath,
            output_csv: outputCsvPath,
            preview: finalResults.slice(0, 3)
        });

    } catch (e: any) {
        console.error("CSV processing error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
