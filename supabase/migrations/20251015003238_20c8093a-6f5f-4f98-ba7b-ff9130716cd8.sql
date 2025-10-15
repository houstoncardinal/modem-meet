-- Add message editing and deletion support
ALTER TABLE public.messages 
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_name TEXT,
ADD COLUMN attachment_type TEXT;

-- Create index for deleted messages
CREATE INDEX idx_messages_deleted_at ON public.messages(deleted_at) WHERE deleted_at IS NULL;

-- Create blocked_users table
CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Enable RLS on blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocked_users
CREATE POLICY "Users can view their blocks"
ON public.blocked_users FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
ON public.blocked_users FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their blocks"
ON public.blocked_users FOR DELETE
USING (auth.uid() = blocker_id);

-- Create banned_room_users table for room bans
CREATE TABLE public.banned_room_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on banned_room_users
ALTER TABLE public.banned_room_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for banned_room_users
CREATE POLICY "Users can view bans in their rooms"
ON public.banned_room_users FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Room admins can create bans"
ON public.banned_room_users FOR INSERT
WITH CHECK (
  public.has_room_role(auth.uid(), room_id, 'moderator')
);

CREATE POLICY "Room admins can delete bans"
ON public.banned_room_users FOR DELETE
USING (
  public.has_room_role(auth.uid(), room_id, 'moderator')
);

-- Create read_receipts table for unread indicators
CREATE TABLE public.read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_read_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on read_receipts
ALTER TABLE public.read_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies for read_receipts
CREATE POLICY "Users can view their own read receipts"
ON public.read_receipts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read receipts"
ON public.read_receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own read receipts"
ON public.read_receipts FOR UPDATE
USING (auth.uid() = user_id);

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for chat attachments
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view attachments in their rooms"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update messages RLS to exclude messages from blocked users
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON public.messages;

CREATE POLICY "Users can view messages in accessible rooms"
ON public.messages FOR SELECT
USING (
  room_id IN (
    SELECT rooms.id FROM rooms
    WHERE (rooms.is_private = false OR rooms.id IN (
      SELECT room_members.room_id FROM room_members WHERE room_members.user_id = auth.uid()
    ))
  ) AND
  -- Exclude messages from blocked users
  user_id NOT IN (
    SELECT blocked_id FROM public.blocked_users WHERE blocker_id = auth.uid()
  ) AND
  -- Exclude deleted messages unless you're the author
  (deleted_at IS NULL OR user_id = auth.uid())
);

-- Allow users to update their own messages (for editing)
CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = user_id);

-- Prevent banned users from joining rooms
DROP POLICY IF EXISTS "Users can join public rooms" ON public.room_members;

CREATE POLICY "Users can join public rooms"
ON public.room_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  (
    (
      (SELECT rooms.is_private FROM rooms WHERE rooms.id = room_members.room_id) = false
    ) OR
    (
      EXISTS (
        SELECT 1 FROM rooms 
        WHERE rooms.id = room_members.room_id AND rooms.invite_code IS NOT NULL
      )
    )
  ) AND
  -- Prevent banned users from joining
  NOT EXISTS (
    SELECT 1 FROM public.banned_room_users 
    WHERE room_id = room_members.room_id AND user_id = auth.uid()
  )
);

-- Create trigger to update read_receipts updated_at
CREATE TRIGGER update_read_receipts_updated_at
BEFORE UPDATE ON public.read_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();