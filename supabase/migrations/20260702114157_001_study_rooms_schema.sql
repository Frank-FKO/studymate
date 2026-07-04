/*
# Study Rooms Schema for Coretex AI

1. New Tables
- `profiles` - User profiles extending auth.users with XP, stats, and settings
- `study_rooms` - Study room details (name, subject, topic, settings, host)
- `room_participants` - Members of each room with roles and stats
- `room_messages` - Chat messages in each room
- `quiz_sessions` - Quiz configurations and sessions
- `quiz_questions` - Questions for each quiz session
- `quiz_answers` - Student answers to quiz questions
- `whiteboard_strokes` - Drawing data for collaborative whiteboard
- `shared_notes` - Collaborative notes with version history
- `study_sessions` - Study session records with time tracking
- `ai_summaries` - AI-generated session summaries
- `notifications` - User notifications
- `achievements` - Achievement definitions
- `user_achievements` - User earned achievements
- `room_invites` - Invite links for private rooms

2. Security
- Enable RLS on all tables
- Policies ensure users can only access rooms they're members of
- Host-only operations for sensitive actions
- Authenticated-only access with proper ownership checks

3. Features
- Full study room lifecycle management
- AI tutor integration via messages
- Collaborative quiz mode with real-time scoring
- Whiteboard collaboration
- Shared notes with auto-save
- Gamification with XP and achievements
- Session tracking and AI summaries
*/

-- User profiles extending auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  total_study_time integer NOT NULL DEFAULT 0,
  quizzes_completed integer NOT NULL DEFAULT 0,
  sessions_attended integer NOT NULL DEFAULT 0,
  achievements_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Study rooms
CREATE TABLE IF NOT EXISTS study_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  topic text,
  description text,
  room_code text UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 8)),
  is_public boolean NOT NULL DEFAULT true,
  max_members integer NOT NULL DEFAULT 10,
  goal text,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_activity text DEFAULT 'Idle',
  total_study_time integer NOT NULL DEFAULT 0,
  focus_sessions integer NOT NULL DEFAULT 0,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Room participants
CREATE TABLE IF NOT EXISTS room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('host', 'co-host', 'member')),
  joined_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  study_time integer NOT NULL DEFAULT 0,
  messages_count integer NOT NULL DEFAULT 0,
  UNIQUE(room_id, user_id)
);

-- Room messages (chat + AI tutor)
CREATE TABLE IF NOT EXISTS room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'ai', 'system', 'quiz', 'timer', 'file', 'voice')),
  metadata jsonb DEFAULT '{}',
  reply_to uuid REFERENCES room_messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Quiz sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_count integer NOT NULL DEFAULT 10,
  question_type text NOT NULL DEFAULT 'mixed' CHECK (question_type IN ('written', 'practical', 'mixed')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  time_limit integer,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_session_id uuid NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  correct_answer text NOT NULL,
  explanation text,
  question_type text NOT NULL DEFAULT 'written',
  options jsonb,
  points integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Quiz answers
CREATE TABLE IF NOT EXISTS quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  answer text NOT NULL,
  is_correct boolean NOT NULL,
  points_earned integer NOT NULL DEFAULT 0,
  feedback text,
  answered_at timestamptz DEFAULT now(),
  UNIQUE(quiz_question_id, user_id)
);

-- Whiteboard strokes
CREATE TABLE IF NOT EXISTS whiteboard_strokes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stroke_data jsonb NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  stroke_width integer NOT NULL DEFAULT 2,
  created_at timestamptz DEFAULT now()
);

-- Shared notes
CREATE TABLE IF NOT EXISTS shared_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid UNIQUE NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}',
  version integer NOT NULL DEFAULT 1,
  last_edited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

-- Note version history
CREATE TABLE IF NOT EXISTS note_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES shared_notes(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  edited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  started_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  topics_covered text[],
  notes_summary text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed'))
);

-- AI Summaries
CREATE TABLE IF NOT EXISTS ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  topics_covered jsonb NOT NULL DEFAULT '[]',
  questions_answered integer NOT NULL DEFAULT 0,
  weak_areas jsonb NOT NULL DEFAULT '[]',
  strong_areas jsonb NOT NULL DEFAULT '[]',
  recommended_revision jsonb NOT NULL DEFAULT '[]',
  personalized_homework jsonb NOT NULL DEFAULT '[]',
  flashcards jsonb NOT NULL DEFAULT '[]',
  key_insights text[],
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Room invites
CREATE TABLE IF NOT EXISTS room_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 12)),
  max_uses integer DEFAULT 0,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_room ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created ON room_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_room ON quiz_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_room ON quiz_answers(room_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_room ON whiteboard_strokes(room_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_room ON study_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_study_rooms_code ON study_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_study_rooms_public ON study_rooms(is_public);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_strokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_invites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Study rooms policies (users can only access rooms they're members of)
DROP POLICY IF EXISTS "study_rooms_select_member" ON study_rooms;
CREATE POLICY "study_rooms_select_member" ON study_rooms FOR SELECT
  TO authenticated USING (
    auth.uid() = host_id OR
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = study_rooms.id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "study_rooms_insert_authenticated" ON study_rooms;
CREATE POLICY "study_rooms_insert_authenticated" ON study_rooms FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "study_rooms_update_host" ON study_rooms;
CREATE POLICY "study_rooms_update_host" ON study_rooms FOR UPDATE
  TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "study_rooms_delete_host" ON study_rooms;
CREATE POLICY "study_rooms_delete_host" ON study_rooms FOR DELETE
  TO authenticated USING (auth.uid() = host_id);

-- Room participants policies
DROP POLICY IF EXISTS "room_participants_select_member" ON room_participants;
CREATE POLICY "room_participants_select_member" ON room_participants FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM room_participants rp WHERE rp.room_id = room_participants.room_id AND rp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "room_participants_insert_self" ON room_participants;
CREATE POLICY "room_participants_insert_self" ON room_participants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "room_participants_update_own" ON room_participants;
CREATE POLICY "room_participants_update_own" ON room_participants FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "room_participants_delete_self_or_host" ON room_participants;
CREATE POLICY "room_participants_delete_self_or_host" ON room_participants FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM study_rooms WHERE id = room_participants.room_id AND host_id = auth.uid())
  );

-- Room messages policies
DROP POLICY IF EXISTS "room_messages_select_member" ON room_messages;
CREATE POLICY "room_messages_select_member" ON room_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = room_messages.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "room_messages_insert_member" ON room_messages;
CREATE POLICY "room_messages_insert_member" ON room_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = room_messages.room_id AND user_id = auth.uid())
  );

-- Quiz sessions policies
DROP POLICY IF EXISTS "quiz_sessions_select_member" ON quiz_sessions;
CREATE POLICY "quiz_sessions_select_member" ON quiz_sessions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = quiz_sessions.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "quiz_sessions_insert_host" ON quiz_sessions;
CREATE POLICY "quiz_sessions_insert_host" ON quiz_sessions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM study_rooms WHERE id = quiz_sessions.room_id AND host_id = auth.uid())
  );

DROP POLICY IF EXISTS "quiz_sessions_update_host" ON quiz_sessions;
CREATE POLICY "quiz_sessions_update_host" ON quiz_sessions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM study_rooms WHERE id = quiz_sessions.room_id AND host_id = auth.uid())
  );

-- Quiz questions policies
DROP POLICY IF EXISTS "quiz_questions_select_member" ON quiz_questions;
CREATE POLICY "quiz_questions_select_member" ON quiz_questions FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions qs
      JOIN room_participants rp ON rp.room_id = qs.room_id
      WHERE qs.id = quiz_questions.quiz_session_id AND rp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "quiz_questions_insert_host" ON quiz_questions;
CREATE POLICY "quiz_questions_insert_host" ON quiz_questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_sessions qs
      JOIN study_rooms sr ON sr.id = qs.room_id
      WHERE qs.id = quiz_questions.quiz_session_id AND sr.host_id = auth.uid()
    )
  );

-- Quiz answers policies
DROP POLICY IF EXISTS "quiz_answers_select_participant" ON quiz_answers;
CREATE POLICY "quiz_answers_select_participant" ON quiz_answers FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM study_rooms WHERE id = quiz_answers.room_id AND host_id = auth.uid()
  ));

DROP POLICY IF EXISTS "quiz_answers_insert_participant" ON quiz_answers;
CREATE POLICY "quiz_answers_insert_participant" ON quiz_answers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Whiteboard strokes policies
DROP POLICY IF EXISTS "whiteboard_select_member" ON whiteboard_strokes;
CREATE POLICY "whiteboard_select_member" ON whiteboard_strokes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = whiteboard_strokes.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "whiteboard_insert_member" ON whiteboard_strokes;
CREATE POLICY "whiteboard_insert_member" ON whiteboard_strokes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = whiteboard_strokes.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "whiteboard_delete_member" ON whiteboard_strokes;
CREATE POLICY "whiteboard_delete_member" ON whiteboard_strokes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = whiteboard_strokes.room_id AND user_id = auth.uid())
  );

-- Shared notes policies
DROP POLICY IF EXISTS "notes_select_member" ON shared_notes;
CREATE POLICY "notes_select_member" ON shared_notes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = shared_notes.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "notes_insert_member" ON shared_notes;
CREATE POLICY "notes_insert_member" ON shared_notes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = shared_notes.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "notes_update_member" ON shared_notes;
CREATE POLICY "notes_update_member" ON shared_notes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = shared_notes.room_id AND user_id = auth.uid())
  );

-- Note versions policies
DROP POLICY IF EXISTS "note_versions_select_member" ON note_versions;
CREATE POLICY "note_versions_select_member" ON note_versions FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM shared_notes sn
      JOIN room_participants rp ON rp.room_id = sn.room_id
      WHERE sn.id = note_versions.note_id AND rp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "note_versions_insert_member" ON note_versions;
CREATE POLICY "note_versions_insert_member" ON note_versions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM shared_notes sn
      JOIN room_participants rp ON rp.room_id = sn.room_id
      WHERE sn.id = note_versions.note_id AND rp.user_id = auth.uid()
    )
  );

-- Study sessions policies
DROP POLICY IF EXISTS "study_sessions_select_member" ON study_sessions;
CREATE POLICY "study_sessions_select_member" ON study_sessions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = study_sessions.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "study_sessions_insert_member" ON study_sessions;
CREATE POLICY "study_sessions_insert_member" ON study_sessions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = study_sessions.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "study_sessions_update_creator" ON study_sessions;
CREATE POLICY "study_sessions_update_creator" ON study_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = started_by) WITH CHECK (auth.uid() = started_by);

-- AI Summaries policies
DROP POLICY IF EXISTS "ai_summaries_select_member" ON ai_summaries;
CREATE POLICY "ai_summaries_select_member" ON ai_summaries FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = ai_summaries.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "ai_summaries_insert_host" ON ai_summaries;
CREATE POLICY "ai_summaries_insert_host" ON ai_summaries FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM study_rooms WHERE id = ai_summaries.room_id AND host_id = auth.uid())
  );

-- Notifications policies
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Achievements policies (public read)
DROP POLICY IF EXISTS "achievements_select_all" ON achievements;
CREATE POLICY "achievements_select_all" ON achievements FOR SELECT
  TO authenticated USING (true);

-- User achievements policies
DROP POLICY IF EXISTS "user_achievements_select_own" ON user_achievements;
CREATE POLICY "user_achievements_select_own" ON user_achievements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_achievements_insert_own" ON user_achievements;
CREATE POLICY "user_achievements_insert_own" ON user_achievements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Room invites policies
DROP POLICY IF EXISTS "room_invites_select_member" ON room_invites;
CREATE POLICY "room_invites_select_member" ON room_invites FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM room_participants WHERE room_id = room_invites.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "room_invites_insert_host" ON room_invites;
CREATE POLICY "room_invites_insert_host" ON room_invites FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM study_rooms WHERE id = room_invites.room_id AND host_id = auth.uid())
  );

DROP POLICY IF EXISTS "room_invites_update_host" ON room_invites;
CREATE POLICY "room_invites_update_host" ON room_invites FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM study_rooms WHERE id = room_invites.room_id AND host_id = auth.uid())
  );

-- Insert default achievements
INSERT INTO achievements (name, display_name, description, icon, xp_reward, requirement_type, requirement_value)
VALUES
  ('team_player', 'Team Player', 'Join your first study room', 'Users', 50, 'rooms_joined', 1),
  ('study_master', 'Study Master', 'Complete 10 study sessions', 'GraduationCap', 200, 'sessions_completed', 10),
  ('focus_champion', 'Focus Champion', 'Study for 5 hours total', 'Target', 150, 'study_hours', 5),
  ('quiz_genius', 'Quiz Genius', 'Score 100% on 5 quizzes', 'Brain', 250, 'perfect_quizzes', 5),
  ('mentor', 'Mentor', 'Help 10 students with their questions', 'Heart', 300, 'help_count', 10),
  ('persistent_learner', 'Persistent Learner', 'Maintain a 7-day study streak', 'Flame', 400, 'streak_days', 7),
  ('collaborator', 'Collaborator', 'Create 3 study rooms', 'UsersRound', 150, 'rooms_created', 3),
  ('quiz_creator', 'Quiz Creator', 'Create 10 quizzes', 'ClipboardList', 200, 'quizzes_created', 10),
  ('note_taker', 'Note Taker', 'Save 50 shared notes versions', 'FileText', 100, 'notes_saved', 50),
  ('early_bird', 'Early Bird', 'Join a room before 8 AM', 'Sunrise', 75, 'early_join', 1)
ON CONFLICT (name) DO NOTHING;