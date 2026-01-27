-- Enable RLS on all tables (already done in previous migration, but good for safety)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_readings ENABLE ROW LEVEL SECURITY;

--
-- Policies for 'users'
-- Assumes public.users.id matches auth.users.id
--

CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

--
-- Policies for 'device'
--

CREATE POLICY "Users can view own devices" 
ON public.device 
FOR SELECT 
USING (auth.uid() = owner);

CREATE POLICY "Users can insert own devices" 
ON public.device 
FOR INSERT 
WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update own devices" 
ON public.device 
FOR UPDATE 
USING (auth.uid() = owner);

CREATE POLICY "Users can delete own devices" 
ON public.device 
FOR DELETE 
USING (auth.uid() = owner);

--
-- Policies for 'Locations'
--

CREATE POLICY "Users can view own locations" 
ON public."Locations" 
FOR SELECT 
USING (auth.uid() = owner);

CREATE POLICY "Users can insert own locations" 
ON public."Locations" 
FOR INSERT 
WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update own locations" 
ON public."Locations" 
FOR UPDATE 
USING (auth.uid() = owner);

CREATE POLICY "Users can delete own locations" 
ON public."Locations" 
FOR DELETE 
USING (auth.uid() = owner);

--
-- Policies for 'water_readings'
--

-- Reading: Users can see readings if they own the device
CREATE POLICY "Users can view own device readings" 
ON public.water_readings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.device
    WHERE device.id = water_readings.device_id
    AND device.owner = auth.uid()
  )
);

-- Inserting: Users can insert readings if they own the device
CREATE POLICY "Users can insert own device readings" 
ON public.water_readings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.device
    WHERE device.id = water_readings.device_id
    AND device.owner = auth.uid()
  )
);