import { Column, Table, Schema, ColumnType } from '@powersync/web';

// Using the more explicit constructor-based schema definition
// which aligns well with the migration file's structure.

export const AppSchema = new Schema([
  new Table({
    name: 'users',
    columns: [
      new Column({ name: 'name', type: ColumnType.TEXT }),
      new Column({ name: 'email', type: ColumnType.TEXT }),
      new Column({ name: 'dark_mode', type: ColumnType.INTEGER }) // Booleans are INTEGER 0 or 1 in SQLite
    ]
  }),
  new Table({
    name: 'device',
    columns: [
      new Column({ name: 'owner', type: ColumnType.TEXT }),
      new Column({ name: 'name', type: ColumnType.TEXT }),
      new Column({ name: 'available', type: ColumnType.INTEGER })
    ]
  }),
  new Table({
    // Per Postgres, this will be lowercase unless quoted.
    // PowerSync SQLite tables are typically lowercase.
    name: 'locations',
    columns: [
      new Column({ name: 'owner', type: ColumnType.TEXT }),
      new Column({ name: 'name', type: ColumnType.TEXT }),
      new Column({ name: 'latitude', type: ColumnType.REAL }),
      new Column({ name: 'longitude', type: ColumnType.REAL })
    ]
  }),
  new Table({
    name: 'water_readings',
    columns: [
      // This is now a foreign key to the local device table
      new Column({ name: 'device_id', type: ColumnType.TEXT }),
      new Column({ name: 'recorded_at', type: ColumnType.TEXT }),
      new Column({ name: 'pressure_pa', type: ColumnType.REAL }),
      new Column({ name: 'battery_voltage', type: ColumnType.REAL }),
      new Column({ name: 'latitude', type: ColumnType.REAL }),
      new Column({ name: 'longitude', type: ColumnType.REAL })
    ]
  })
]);