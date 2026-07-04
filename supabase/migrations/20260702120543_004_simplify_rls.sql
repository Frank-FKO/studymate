/*
# Simplify RLS Policies - Remove All Circular Dependencies

1. Problem
- EVEN with SECURITY DEFINER function, Supabase/Postgres still detects recursion
- Need to completely eliminate cross-table policy references

2. Solution
- Just drop the problematic SELECT policies and recreate them simply
- No cross-table references at all
*/

-- Drop only the SELECT policies that cause circular references
DROP POLICY IF EXISTS "study_rooms_select_access" ON study_rooms;
DROP POLICY IF EXISTS "study_rooms_select_member" ON study_rooms;
DROP POLICY IF EXISTS "room_participants_select_member" ON room_participants;
DROP POLICY IF EXISTS "room_participants_select_own_or_host" ON room_participants;
DROP POLICY IF EXISTS "room_participants_select_own" ON room_participants;
DROP POLICY IF EXISTS "room_participants_select_self" ON room_participants;

-- Drop the function too
DROP FUNCTION IF EXISTS is_room_member(uuid);

-- study_rooms: Show rooms where user is host
CREATE POLICY "study_rooms_select_is_host" ON study_rooms FOR SELECT
  TO authenticated USING (auth.uid() = host_id);

-- room_participants: Users see their own records
CREATE POLICY "room_participants_view_own" ON room_participants FOR SELECT
  TO authenticated USING (auth.uid() = user_id);