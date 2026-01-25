-- Create the water_readings table
CREATE TABLE
  water_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    device_id TEXT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT now (),
    pressure_pa FLOAT8,
    battery_voltage FLOAT4,
    latitude FLOAT8,
    longitude FLOAT8
  );

-- Enable Row Level Security (RLS)
ALTER TABLE water_readings ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows full access to authenticated users
CREATE POLICY authenticated_users_full_access ON water_readings FOR ALL TO authenticated USING (TRUE)
WITH
  CHECK (TRUE);

-- Create a publication for PowerSync (or add table if exists)
DO $$
BEGIN
  -- Check if publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
    CREATE PUBLICATION powersync FOR TABLE water_readings;
  ELSE
    -- If it exists, only add the table if it's NOT defined as 'FOR ALL TABLES'
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync' AND puballtables = true) THEN
      BEGIN
        ALTER PUBLICATION powersync ADD TABLE water_readings;
      EXCEPTION
        WHEN duplicate_object THEN
          NULL; -- Table already in publication, ignore
      END;
    END IF;
  END IF;
END
$$;
