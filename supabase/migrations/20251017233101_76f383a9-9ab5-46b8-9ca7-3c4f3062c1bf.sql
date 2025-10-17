-- Fix critical security issue: Require authentication for posts and engagement data
-- This prevents unauthenticated access to user posts, GPS coordinates, and social data

-- Update posts table RLS policy to require authentication
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;

CREATE POLICY "Authenticated users can view posts"
ON public.posts
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Update post_comments table RLS policy to require authentication
DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;

CREATE POLICY "Authenticated users can view comments"
ON public.post_comments
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Update post_likes table RLS policy to require authentication
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;

CREATE POLICY "Authenticated users can view post likes"
ON public.post_likes
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Update post_tags table RLS policy to require authentication
DROP POLICY IF EXISTS "Anyone can view post tags" ON public.post_tags;

CREATE POLICY "Authenticated users can view post tags"
ON public.post_tags
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);