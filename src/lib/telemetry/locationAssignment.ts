
// Constants from ml/code/location_id_create.ipynb
export const MAX_DIST_M = 1000; // 1 km

// Communities (lat, lon) matching the Python notebook exactly
export const COMMUNITIES: [number, number][] = [
    [15.5007, 32.5599], [15.6133, 32.5322], [14.4015, 33.5198], 
    [13.1747, 30.2097], [12.8628, 32.9838], [14.0000, 31.0000],
    [15.0000, 35.0000], [13.5000, 34.0000], [12.5000, 30.5000],
    [15.8000, 33.2000], [14.2000, 32.1000], [13.9000, 35.5000],
    [14.8000, 34.5000], [15.2000, 31.8000], [12.9000, 33.9000],
    [13.2000, 31.2000], [14.5000, 33.1000], [15.4000, 32.8000],
    [13.7000, 30.8000]
];

const COMM_IDS = COMMUNITIES.map((_, i) => `loc_${(i + 1).toString().padStart(3, '0')}`);

// Helper: Haversine distance (meters)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const dphi = toRad(lat2 - lat1);
    const dlambda = toRad(lon2 - lon1);

    const a = Math.sin(dphi / 2) ** 2 +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(dlambda / 2) ** 2;
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export interface TelemetryWithLocation {
    lat: number;
    lon: number;
    location_id?: string;
    in_community?: boolean;
    [key: string]: any; // Allow other properties
}

/**
 * Assigns the nearest location_id to a telemetry record based on hardcoded community coordinates.
 * Adds 'location_id' and 'in_community' fields to the record.
 */
export function assignLocationToRecord(record: TelemetryWithLocation): TelemetryWithLocation {
    if (typeof record.lat !== 'number' || typeof record.lon !== 'number') {
        return record;
    }

    let minDistance = Infinity;
    let nearestIndex = -1;

    // Find nearest community
    for (let i = 0; i < COMMUNITIES.length; i++) {
        const [commLat, commLon] = COMMUNITIES[i];
        const dist = haversineDistance(record.lat, record.lon, commLat, commLon);
        
        if (dist < minDistance) {
            minDistance = dist;
            nearestIndex = i;
        }
    }

    if (nearestIndex !== -1) {
        record.location_id = COMM_IDS[nearestIndex];
        record.in_community = minDistance <= MAX_DIST_M;
    }

    return record;
}

/**
 * Batch process a list of records
 */
export function assignLocationsToBatch(records: TelemetryWithLocation[]): TelemetryWithLocation[] {
    return records.map(assignLocationToRecord);
}
