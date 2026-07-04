/*
# Enhanced Learning Platform Schema

This migration creates tables for:
- Subjects with progress tracking
- Lessons with structured content
- Quizzes with adaptive difficulty
- Quiz attempts with detailed tracking
- Flashcards
- Learning memory (AI context)
- Study planner
- XP history
- Activity history
*/

-- Subjects table (predefined subjects with user progress)
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT 'BookOpen',
  color text DEFAULT 'primary',
  total_lessons integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User subject progress
CREATE TABLE user_subject_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  lessons_completed integer DEFAULT 0,
  quizzes_completed integer DEFAULT 0,
  total_quizzes_passed integer DEFAULT 0,
  total_study_time integer DEFAULT 0,
  mastery_percentage numeric(5,2) DEFAULT 0,
  average_score numeric(5,2) DEFAULT 0,
  weakest_topic text,
  strongest_topic text,
  last_studied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subject_id)
);

-- Lessons table
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  estimated_minutes integer DEFAULT 15,
  objectives jsonb DEFAULT '[]',
  simple_explanation text,
  detailed_explanation text,
  examples jsonb DEFAULT '[]',
  common_mistakes jsonb DEFAULT '[]',
  memory_tips jsonb DEFAULT '[]',
  practice_questions jsonb DEFAULT '[]',
  summary text,
  order_index integer DEFAULT 0,
  prerequisites jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(subject_id, slug)
);

-- User lesson progress
CREATE TABLE user_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  time_spent integer DEFAULT 0,
  explanations_viewed jsonb DEFAULT '[]',
  flashcards_reviewed boolean DEFAULT false,
  quiz_taken boolean DEFAULT false,
  mastery_level numeric(5,2) DEFAULT 0,
  notes text,
  UNIQUE(user_id, lesson_id)
);

-- Quizzes table
CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard', 'adaptive')) DEFAULT 'adaptive',
  time_limit integer DEFAULT 600,
  passing_score integer DEFAULT 70,
  questions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Quiz attempts
CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  score integer DEFAULT 0,
  total_questions integer NOT NULL,
  correct_answers integer DEFAULT 0,
  time_taken integer,
  answers jsonb NOT NULL DEFAULT '[]',
  strengths jsonb DEFAULT '[]',
  weaknesses jsonb DEFAULT '[]',
  topics_to_review jsonb DEFAULT '[]',
  difficulty_adjusted boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  xp_earned integer DEFAULT 0
);

-- Flashcards
CREATE TABLE flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  hints jsonb DEFAULT '[]',
  difficulty text DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

-- User flashcard progress
CREATE TABLE flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  flashcard_id uuid REFERENCES flashcards(id) ON DELETE CASCADE NOT NULL,
  times_reviewed integer DEFAULT 0,
  times_correct integer DEFAULT 0,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  ease_factor numeric(4,2) DEFAULT 2.5,
  interval_days integer DEFAULT 1,
  UNIQUE(user_id, flashcard_id)
);

-- Learning memory (AI context)
CREATE TABLE learning_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subjects_studied jsonb DEFAULT '[]',
  mastered_topics jsonb DEFAULT '[]',
  struggling_topics jsonb DEFAULT '[]',
  frequent_mistakes jsonb DEFAULT '[]',
  preferred_explanation_style text DEFAULT 'detailed',
  learning_speed text DEFAULT 'moderate',
  confidence_level numeric(5,2) DEFAULT 50,
  total_xp integer DEFAULT 0,
  current_level integer DEFAULT 1,
  daily_goal integer DEFAULT 30,
  weekly_goal integer DEFAULT 180,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_study_date date,
  study_preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI conversation history
CREATE TABLE ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  conversation_type text DEFAULT 'tutor',
  messages jsonb NOT NULL DEFAULT '[]',
  context jsonb DEFAULT '{}',
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Study planner
CREATE TABLE study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  sessions jsonb NOT NULL DEFAULT '[]',
  ai_generated boolean DEFAULT true,
  completed_sessions integer DEFAULT 0,
  total_minutes integer DEFAULT 0,
  completed_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- XP history
CREATE TABLE xp_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  source text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Activity history
CREATE TABLE activity_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  xp_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Insert default subjects
INSERT INTO subjects (name, slug, description, icon, color) VALUES
('Mathematics', 'mathematics', 'Numbers, structures, and logical reasoning', 'Calculator', 'primary'),
('Physics', 'physics', 'Matter, energy, and the fundamental forces of nature', 'Atom', 'accent'),
('Chemistry', 'chemistry', 'Elements, compounds, and chemical reactions', 'FlaskConical', 'success'),
('Biology', 'biology', 'Living organisms and life processes', 'Leaf', 'success'),
('History', 'history', 'Past events and human civilization', 'Scroll', 'warning'),
('Literature', 'literature', 'Written works and literary analysis', 'BookOpen', 'primary'),
('Computer Science', 'computer-science', 'Computing, algorithms, and programming', 'Code', 'accent'),
('Economics', 'economics', 'Production, distribution, and consumption', 'TrendingUp', 'warning'),
('Psychology', 'psychology', 'Mind, behavior, and mental processes', 'Brain', 'accent'),
('Geography', 'geography', 'Earth, places, and human-environment interaction', 'Globe', 'primary');

-- Enable RLS on all new tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subject_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects (public read)
CREATE POLICY "subjects_read_all" ON subjects FOR SELECT
  TO authenticated USING (true);

-- RLS Policies for user_* tables (user only)
CREATE POLICY "usp_select_own" ON user_subject_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "usp_insert_own" ON user_subject_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usp_update_own" ON user_subject_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lessons_read_all" ON lessons FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "ulp_select_own" ON user_lesson_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ulp_insert_own" ON user_lesson_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ulp_update_own" ON user_lesson_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quizzes_read_all" ON quizzes FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "qa_select_own" ON quiz_attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "qa_insert_own" ON quiz_attempts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "qa_update_own" ON quiz_attempts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "flashcards_read_all" ON flashcards FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "fr_select_own" ON flashcard_reviews FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fr_insert_own" ON flashcard_reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fr_update_own" ON flashcard_reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lm_select_own" ON learning_memory FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "lm_insert_own" ON learning_memory FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lm_update_own" ON learning_memory FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ac_select_own" ON ai_conversations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ac_insert_own" ON ai_conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ac_update_own" ON ai_conversations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sp_select_own" ON study_plans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sp_insert_own" ON study_plans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sp_update_own" ON study_plans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "xh_select_own" ON xp_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "xh_insert_own" ON xp_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ah_select_own" ON activity_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ah_insert_own" ON activity_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_subject_progress_user ON user_subject_progress(user_id);
CREATE INDEX idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_flashcard_reviews_user ON flashcard_reviews(user_id);
CREATE INDEX idx_learning_memory_user ON learning_memory(user_id);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_study_plans_user_date ON study_plans(user_id, date);
CREATE INDEX idx_xp_history_user ON xp_history(user_id);
CREATE INDEX idx_activity_history_user ON activity_history(user_id);
CREATE INDEX idx_lessons_subject ON lessons(subject_id);
CREATE INDEX idx_quizzes_subject ON quizzes(subject_id);