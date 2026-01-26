-- Migration to create core application tables based on the ERD.

-- First, drop the old water_readings table to apply breaking changes.
DROP TABLE IF EXISTS public.water_readings;

-- Create the `users` table
CREATE TABLE
  public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    dark_mode BOOLEAN NOT NULL DEFAULT FALSE
  );

-- Create the `device` table
CREATE TABLE
  public.device (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    owner UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    name TEXT,
    available BOOLEAN NOT NULL DEFAULT TRUE
  );

-- Create the `Locations` table
-- Note: Quoted to handle uppercase character. 'locations' is the recommended naming convention.
CREATE TABLE
  public."Locations" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    owner UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL
  );

-- Create the `water_readings` table (new version)
CREATE TABLE
  public.water_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    device_id UUID NOT NULL REFERENCES public.device (id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    pressure_pa FLOAT8,
    battery_voltage FLOAT4,
    latitude FLOAT8,
    longitude FLOAT8
  );

-- Enable Row Level Security for all new tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.device ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."Locations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.water_readings ENABLE ROW LEVEL SECURITY;


