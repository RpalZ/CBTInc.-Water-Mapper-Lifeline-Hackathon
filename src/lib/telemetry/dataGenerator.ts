import { COMMUNITIES } from "./locationAssignment";

// Types for raw telemetry
export interface RawTelemetry {
    device_id: string;
    recorded_at: string;
    pressure_pa: number;
    battery_v: number;
    lat: number;
    lon: number;
    hdop: number;
    sat_count: number;
    fix_type: string;
    speed_mps: number;
    msg_type: string;
    event_type: string;
    pressure_prev?: number;
    time_prev?: string;
    delta_t_hours?: number;
    pressure_delta?: number;
    dispense_rate_pa_per_hr?: number;
    dispense_rate_lph?: number;
    valid_gps: string;
    delta_volume_l?: number;
    dispensed_l?: number;
    date: string;
    location_id?: string;
    in_community?: boolean;
}

const EVENT_TYPES = ['HEARTBEAT', 'REFILL', 'SERVICE_STOP', 'DEPLETED'];
const DEVICE_IDS = Array.from({ length: 20 }, (_, i) => `can_${(i + 1).toString().padStart(3, '0')}`);

function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// 1 degree lat/lon is roughly 111km. 
// 0.01 degree is ~1.1km. 
// We want points within ~1-2km of the center.
const OFFSET_RANGE = 0.015; 

export function generateRawTelemetry(count: number = 100): RawTelemetry[] {
    const data: RawTelemetry[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        // Random time within the last 24 hours
        const timeOffset = randomInt(0, 24 * 60 * 60 * 1000);
        const recordedAt = new Date(now.getTime() - timeOffset);
        
        // Pick a random community center
        const [centerLat, centerLon] = randomChoice(COMMUNITIES);
        
        // Add random offset
        const lat = centerLat + randomFloat(-OFFSET_RANGE, OFFSET_RANGE);
        const lon = centerLon + randomFloat(-OFFSET_RANGE, OFFSET_RANGE);

        // Basic pressure logic: REFILL high, DEPLETED low
        const eventType = randomChoice(EVENT_TYPES);
        let pressure = 101325; // atmospheric
        let dispensed = 0;

        if (eventType === 'REFILL') {
            pressure = randomFloat(105000, 112000);
        } else if (eventType === 'DEPLETED') {
            pressure = 101325;
        } else {
            pressure = randomFloat(101325, 108000);
            dispensed = randomFloat(0, 50); // Some usage
        }

        const record: RawTelemetry = {
            device_id: randomChoice(DEVICE_IDS),
            recorded_at: recordedAt.toISOString(),
            pressure_pa: pressure,
            battery_v: randomFloat(3.5, 4.2),
            lat: lat,
            lon: lon,
            hdop: randomFloat(0.8, 2.0),
            sat_count: randomInt(4, 14),
            fix_type: '3D',
            speed_mps: randomFloat(0, 1.5), // Mostly stationary for valid points
            msg_type: 'EVENT',
            event_type: eventType,
            valid_gps: 'True',
            dispensed_l: dispensed,
            date: recordedAt.toISOString().split('T')[0],
            // Derived fields left empty or basic defaults for now
            pressure_delta: randomFloat(0, 5000),
        };

        data.push(record);
    }

    return data;
}
