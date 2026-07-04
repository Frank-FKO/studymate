/*
# Add helper functions for XP and achievements
*/

-- Function to add XP to user profile
CREATE OR REPLACE FUNCTION add_user_xp(user_uuid uuid, xp_amount integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET xp = xp + xp_amount,
      level = FLOOR((xp + xp_amount) / 1000) + 1,
      updated_at = now()
  WHERE id = user_uuid;
$$;

-- Function to get user's learning context for AI
CREATE OR REPLACE FUNCTION get_learning_context(user_uuid uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'memory', (SELECT row_to_json(lm.*) FROM learning_memory lm WHERE lm.user_id = user_uuid),
    'subjects', (SELECT jsonb_agg(row_to_json(sp.*)) FROM user_subject_progress sp WHERE sp.user_id = user_uuid),
    'recent_activities', (
      SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT id, user_id, activity_type, description, metadata, xp_earned, created_at 
        FROM activity_history 
        WHERE user_id = user_uuid 
        ORDER BY created_at DESC 
        LIMIT 10
      ) t
    ),
    'quiz_attempts', (
      SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT * FROM quiz_attempts 
        WHERE user_id = user_uuid 
        ORDER BY started_at DESC 
        LIMIT 5
      ) t
    )
  );
$$;