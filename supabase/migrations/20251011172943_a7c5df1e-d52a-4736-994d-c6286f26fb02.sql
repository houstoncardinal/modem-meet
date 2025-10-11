-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  topic TEXT,
  category TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'message' CHECK (type IN ('message', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create room_members table for tracking room membership
CREATE TABLE public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Rooms policies
CREATE POLICY "Users can view public rooms"
  ON public.rooms FOR SELECT
  USING (is_private = false OR id IN (
    SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms"
  ON public.rooms FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Room creators can delete their rooms"
  ON public.rooms FOR DELETE
  USING (auth.uid() = created_by);

-- Messages policies
CREATE POLICY "Users can view messages in accessible rooms"
  ON public.messages FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM public.rooms 
      WHERE is_private = false 
      OR id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert messages in accessible rooms"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (
      SELECT id FROM public.rooms 
      WHERE is_private = false 
      OR id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid())
    )
  );

-- Room members policies
CREATE POLICY "Users can view room members"
  ON public.room_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join public rooms"
  ON public.room_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (SELECT is_private FROM public.rooms WHERE id = room_id) = false
  );

CREATE POLICY "Room creators can add members to private rooms"
  ON public.room_members FOR INSERT
  WITH CHECK (
    room_id IN (SELECT id FROM public.rooms WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can leave rooms"
  ON public.room_members FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;

-- Insert some default public rooms
INSERT INTO public.rooms (name, topic, category, is_private, created_by) VALUES
  ('general', 'General discussion & vibes', 'General', false, NULL),
  ('tech-talk', 'Technology & coding', 'Technology', false, NULL),
  ('music-lounge', 'Share your favorite tunes', 'Entertainment', false, NULL),
  ('gaming-zone', 'PC, console & mobile gaming', 'Gaming', false, NULL),
  ('art-corner', 'Digital & traditional art', 'Creative', false, NULL),
  ('late-night', 'Night owls unite', 'General', false, NULL),
  ('meme-factory', 'Dank memes only', 'Entertainment', false, NULL),
  ('study-group', 'Focus & productivity', 'Education', false, NULL);
