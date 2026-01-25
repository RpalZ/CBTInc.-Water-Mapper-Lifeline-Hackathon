import { Column, Table, Schema, ColumnType } from '@powersync/web';

export const AppSchema = new Schema([
  new Table({
    name: 'water_readings',
    columns: [
      new Column({ name: 'device_id', type: ColumnType.TEXT }),
      new Column({ name: 'recorded_at', type: ColumnType.TEXT }),
      new Column({ name: 'pressure_pa', type: ColumnType.REAL }),
      new Column({ name: 'battery_voltage', type: ColumnType.REAL }),
      new Column({ name: 'latitude', type: ColumnType.REAL }),
      new Column({ name: 'longitude', type: ColumnType.REAL })
    ]
  })
]);
