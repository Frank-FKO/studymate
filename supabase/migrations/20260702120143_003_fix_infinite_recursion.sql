/*
# Fix Infinite Recursion in RLS Policies

1. Problem
- study_rooms policy checks room_participants
- room_participants policy checks study_rooms
- This creates a circular reference causing infinite recursion

2. Solution
- Use simpler policies that don't cross-reference
- study_rooms: Allow if user is host OR use a security definer function
- room_participants: Allow users to see their own records only
*/

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "study_rooms_select_member" ON study_rooms;
DROP POLICY IF EXISTS "room_participants_select_own_or_host" ON room_participants;
DROP POLICY IF EXISTS "room_participants_select_member" ON room_participants;

-- Create a security definer function to check room membership
-- This breaks the circular dependency
CREATE OR REPLACE FUNCTION is_room_member(room_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM room_participants 
    WHERE room_id = room_uuid AND user_id = auth.uid()
  );
$$;

-- study_rooms: user can see if they're host or a member (via function)
CREATE POLICY "study_rooms_select_access" ON study_rooms FOR SELECT
  TO authenticated USING (
    auth.uid() = host_id OR is_room_member(id)
  );

-- room_participants: users can see their own records OR see participants of rooms where they're host
CREATE POLICY "room_participants_select_own" ON room_participants FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM study_rooms WHERE id = room_participants.room_id AND host_id = auth.uid())
  );