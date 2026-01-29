import { Schema, Table, column } from '@powersync/web';

export const AppSchema = new Schema({
  users: new Table({
    name: column.text,
    email: column.text,
    dark_mode: column.integer
  }),
  device: new Table({
    owner: column.text,
    name: column.text,
    available: column.integer,
    vehicle_id: column.text
  }),
  location: new Table({
    water_demand_daily: column.real,
    latitude: column.real,
    longitude: column.real,
    label: column.text,
    owner: column.text,
    runout_probability: column.real,
    name: column.text
  }),
  vehicle: new Table({
    capacity: column.real,
    latitude: column.real,
    longitude: column.real,
    type: column.text,
    owner: column.text,
    name: column.text,
    assigned_location_id: column.text
  }),
  water_readings: new Table({
    device_id: column.text,
    recorded_at: column.text,
    pressure_pa: column.real,
    battery_voltage: column.real,
    latitude: column.real,
    longitude: column.real
  })
});
