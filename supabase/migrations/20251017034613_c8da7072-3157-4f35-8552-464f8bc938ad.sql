-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
ON public.user_roles FOR SELECT
USING (true);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add message rate limiting table
CREATE TABLE public.message_rate_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  message_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

ALTER TABLE public.message_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
ON public.message_rate_limit FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rate limits"
ON public.message_rate_limit FOR ALL
USING (auth.uid() = user_id);

-- Add online status tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to check if user is online (within last 5 minutes)
CREATE OR REPLACE FUNCTION public.is_user_online(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id 
    AND last_seen > NOW() - INTERVAL '5 minutes'
  )
$$;

-- Add system messages type
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Create reported messages table
CREATE TABLE public.reported_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.reported_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report messages"
ON public.reported_messages FOR INSERT
WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Moderators can view reports"
ON public.reported_messages FOR SELECT
USING (
  public.has_role(auth.uid(), 'moderator') OR 
  auth.uid() = reported_by
);

CREATE POLICY "Moderators can update reports"
ON public.reported_messages FOR UPDATE
USING (public.has_role(auth.uid(), 'moderator'));