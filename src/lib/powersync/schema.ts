import { Schema, Table, column } from '@powersync/web';

export const AppSchema = new Schema({
  water_readings: new Table({
    device_id: column.text,
    recorded_at: column.text,
    pressure_pa: column.real,
    battery_voltage: column.real,
    latitude: column.real,
    longitude: column.real
  })
});