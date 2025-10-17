-- Fix security warning: Add search_path to is_user_online function
CREATE OR REPLACE FUNCTION public.is_user_online(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id 
    AND last_seen > NOW() - INTERVAL '5 minutes'
  )
$$;