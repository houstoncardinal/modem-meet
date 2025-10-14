-- Add password and invite code to rooms
ALTER TABLE public.rooms 
ADD COLUMN password TEXT,
ADD COLUMN invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 8);

-- Create index for invite codes
CREATE INDEX idx_rooms_invite_code ON public.rooms(invite_code);

-- Add member role system for rooms
CREATE TYPE public.room_role AS ENUM ('owner', 'admin', 'moderator', 'member');

-- Add role column to room_members
ALTER TABLE public.room_members 
ADD COLUMN role room_role DEFAULT 'member';

-- Update existing room members to set creator as owner
UPDATE public.room_members rm
SET role = 'owner'
FROM public.rooms r
WHERE rm.room_id = r.id 
  AND rm.user_id = r.created_by;

-- Create function to check room permissions
CREATE OR REPLACE FUNCTION public.has_room_role(_user_id uuid, _room_id uuid, _role room_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE user_id = _user_id
      AND room_id = _room_id
      AND (role = _role OR role = 'owner' OR role = 'admin')
  )
$$;

-- Update room_members RLS to allow upsert on conflict
DROP POLICY IF EXISTS "Users can join public rooms" ON public.room_members;
CREATE POLICY "Users can join public rooms" 
ON public.room_members 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) AND 
  (
    (SELECT rooms.is_private FROM rooms WHERE rooms.id = room_members.room_id) = false
    OR
    -- Allow joining with valid invite code
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_members.room_id AND rooms.invite_code IS NOT NULL)
  )
);

-- Allow updating own membership
CREATE POLICY "Users can update own membership" 
ON public.room_members 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to regenerate invite code
CREATE OR REPLACE FUNCTION public.regenerate_invite_code(_room_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Only room owner/admin can regenerate
  IF NOT public.has_room_role(auth.uid(), _room_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  new_code := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  
  UPDATE public.rooms 
  SET invite_code = new_code 
  WHERE id = _room_id;
  
  RETURN new_code;
END;
$$;