-- Allow anyone (authenticated) to view locations where owner is NULL (System Locations)
CREATE POLICY "Public view for system locations"
ON public.location
FOR SELECT
TO authenticated
USING (owner IS NULL);

-- Allow anyone (authenticated) to view vehicles where owner is NULL (System Vehicles)
CREATE POLICY "Public view for system vehicles"
ON public.vehicle
FOR SELECT
TO authenticated
USING (owner IS NULL);
