-- Drop the old table
DROP TABLE IF EXISTS public."Locations";

-- Create Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_label') THEN
        CREATE TYPE public.location_label AS ENUM ('community', 'depot');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type') THEN
        CREATE TYPE public.vehicle_type AS ENUM ('truck', 'car');
    END IF;
END$$;

-- Create location table
CREATE TABLE public.location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    water_demand_daily DOUBLE PRECISION,
    latitude FLOAT8,
    longitude FLOAT8,
    label public.location_label,
    owner UUID REFERENCES public.users(id) ON DELETE CASCADE,
    runout_probability DOUBLE PRECISION
);

-- Create vehicle table
CREATE TABLE public.vehicle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capacity DOUBLE PRECISION,
    latitude FLOAT8,
    longitude FLOAT8,
    type public.vehicle_type,
    owner UUID REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.location ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle ENABLE ROW LEVEL SECURITY;

-- Policies for location
CREATE POLICY "Users can view own locations" ON public.location FOR SELECT USING (auth.uid() = owner);
CREATE POLICY "Users can insert own locations" ON public.location FOR INSERT WITH CHECK (auth.uid() = owner);
CREATE POLICY "Users can update own locations" ON public.location FOR UPDATE USING (auth.uid() = owner);
CREATE POLICY "Users can delete own locations" ON public.location FOR DELETE USING (auth.uid() = owner);

-- Policies for vehicle
CREATE POLICY "Users can view own vehicles" ON public.vehicle FOR SELECT USING (auth.uid() = owner);
CREATE POLICY "Users can insert own vehicles" ON public.vehicle FOR INSERT WITH CHECK (auth.uid() = owner);
CREATE POLICY "Users can update own vehicles" ON public.vehicle FOR UPDATE USING (auth.uid() = owner);
CREATE POLICY "Users can delete own vehicles" ON public.vehicle FOR DELETE USING (auth.uid() = owner);

-- Add to publication for PowerSync
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync' AND puballtables = true) THEN
      ALTER PUBLICATION powersync ADD TABLE public.location, public.vehicle;
    END IF;
  END IF;
END
$$;
