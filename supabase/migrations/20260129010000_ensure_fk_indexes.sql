-- Ensure Foreign Keys are indexed and NOT unique (One-to-Many relationships)

-- 1. Index vehicle -> location (Many vehicles can be at one location)
CREATE INDEX IF NOT EXISTS idx_vehicle_assigned_location_id ON public.vehicle(assigned_location_id);

-- 2. Index device -> vehicle (Many devices can be on one vehicle)
CREATE INDEX IF NOT EXISTS idx_device_vehicle_id ON public.device(vehicle_id);

-- 3. Index location -> users (Many locations can belong to one user)
CREATE INDEX IF NOT EXISTS idx_location_owner ON public.location(owner);

-- 4. Index vehicle -> users (Many vehicles can belong to one user)
CREATE INDEX IF NOT EXISTS idx_vehicle_owner ON public.vehicle(owner);

-- Comments to explicitly document the relationship type
COMMENT ON COLUMN public.vehicle.assigned_location_id IS 'Foreign Key to location. Non-unique: Multiple vehicles can be assigned to the same depot.';
COMMENT ON COLUMN public.device.vehicle_id IS 'Foreign Key to vehicle. Non-unique: Multiple devices can be attached to the same vehicle.';
