/*
# Add RPC function to get single room details

This function allows fetching a room by ID if the user is host or participant.
*/

CREATE OR REPLACE FUNCTION get_room_for_user(room_uuid uuid, user_uuid uuid)
RETURNS TABLE (
  id uuid,
  name text,
  subject text,
  topic text,
  description text,
  room_code text,
  is_public boolean,
  max_members integer,
  goal text,
  host_id uuid,
  current_activity text,
  total_study_time integer,
  focus_sessions integer,
  settings jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.*
  FROM study_rooms r
  WHERE r.id = room_uuid
    AND (r.host_id = user_uuid OR EXISTS (
      SELECT 1 FROM room_participants rp 
      WHERE rp.room_id = r.id AND rp.user_id = user_uuid
    ));
$$;