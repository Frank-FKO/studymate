/*
# Create function to get user's rooms (host + joined)

This function bypasses RLS to get all rooms a user has access to.
*/

CREATE OR REPLACE FUNCTION get_user_rooms(user_uuid uuid)
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
  WHERE r.host_id = user_uuid
     OR EXISTS (
       SELECT 1 FROM room_participants rp 
       WHERE rp.room_id = r.id AND rp.user_id = user_uuid
     )
  ORDER BY r.updated_at DESC;
$$;