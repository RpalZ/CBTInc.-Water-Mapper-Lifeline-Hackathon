-- Add name column to location table
ALTER TABLE public.location ADD COLUMN IF NOT EXISTS name TEXT;

-- Add name and assigned_location_id to vehicle table
ALTER TABLE public.vehicle ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.vehicle ADD COLUMN IF NOT EXISTS assigned_location_id UUID REFERENCES public.location(id) ON DELETE SET NULL;

-- Add vehicle_id to device table
ALTER TABLE public.device ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicle(id) ON DELETE SET NULL;
