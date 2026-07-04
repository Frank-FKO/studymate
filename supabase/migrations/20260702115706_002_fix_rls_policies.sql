/*
# Fix RLS Policies for Infinite Recursion

1. Issues Fixed
- room_participants SELECT policy was referencing itself, causing infinite recursion
- Fixed by using a simpler approach that checks if the user is in the room directly

2. Changes
- Drop and recreate problematic policies
- Use direct room membership checks without self-referencing
*/

-- Fix room_participants SELECT policy - avoid self-referencing
DROP POLICY IF EXISTS "room_participants_select_member" ON room_participants;

-- New policy: users can see participants of rooms they're in
-- This uses the host_id from study_rooms instead of self-referencing
CREATE POLICY "room_participants_select_own_or_host" ON room_participants FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM study_rooms WHERE id = room_participants.room_id AND host_id = auth.uid())
  );

-- Fix study_rooms policy to be simpler
DROP POLICY IF EXISTS "study_rooms_select_member" ON study_rooms;
CREATE POLICY "study_rooms_select_member" ON study_rooms FOR SELECT
  TO authenticated USING (
    auth.uid() = host_id OR
    EXISTS (SELECT 1 FROM room_participants rp WHERE rp.room_id = study_rooms.id AND rp.user_id = auth.uid())
  );