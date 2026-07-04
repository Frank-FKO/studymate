/*
# Fix RLS for Public Rooms Discovery

Users should be able to see:
1. Rooms they host
2. Public rooms (for discovery/joining)

For rooms they've joined, they can see their participant record.
*/

-- Drop and recreate study_rooms SELECT policy
DROP POLICY IF EXISTS "study_rooms_select_is_host" ON study_rooms;

-- Allow users to see rooms they host OR public rooms (for discovery)
CREATE POLICY "study_rooms_select_accessible" ON study_rooms FOR SELECT
  TO authenticated USING (auth.uid() = host_id OR is_public = true);