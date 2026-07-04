import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Profile
export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  total_study_time: number;
  quizzes_completed: number;
  sessions_attended: number;
  achievements_count: number;
  created_at: string;
  updated_at: string;
}

// Study Rooms
export interface StudyRoom {
  id: string;
  name: string;
  subject: string;
  topic: string | null;
  description: string | null;
  room_code: string;
  is_public: boolean;
  max_members: number;
  goal: string | null;
  host_id: string;
  current_activity: string;
  total_study_time: number;
  focus_sessions: number;
  settings: Json;
  created_at: string;
  updated_at: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  last_active_at: string;
  study_time: number;
  messages_count: number;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string | null;
  content: string;
  message_type: string;
  metadata: Json;
  reply_to: string | null;
  created_at: string;
}

// Quiz System
export interface QuizSession {
  id: string;
  room_id: string;
  created_by: string;
  subject: string;
  topic: string | null;
  difficulty: string;
  question_count: number;
  question_type: string;
  status: string;
  time_limit: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_session_id: string;
  question_text: string;
  correct_answer: string;
  explanation: string | null;
  question_type: string;
  options: Json;
  points: number;
  order_index: number;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  quiz_question_id: string;
  user_id: string;
  room_id: string;
  answer: string;
  is_correct: boolean;
  points_earned: number;
  feedback: string | null;
  answered_at: string;
}

// Whiteboard & Notes
export interface WhiteboardStroke {
  id: string;
  room_id: string;
  user_id: string;
  stroke_data: Json;
  color: string;
  stroke_width: number;
  created_at: string;
}

export interface SharedNotes {
  id: string;
  room_id: string;
  content: Json;
  version: number;
  last_edited_by: string | null;
  updated_at: string;
}

// Study Sessions & AI
export interface StudySession {
  id: string;
  room_id: string;
  started_by: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  topics_covered: string[] | null;
  notes_summary: string | null;
  status: string;
}

export interface AISummary {
  id: string;
  session_id: string;
  room_id: string;
  topics_covered: Json;
  questions_answered: number;
  weak_areas: Json;
  strong_areas: Json;
  recommended_revision: Json;
  personalized_homework: Json;
  flashcards: Json;
  key_insights: string[] | null;
  created_at: string;
}

// Notifications & Achievements
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Json;
  read: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievements?: Achievement;
}

export interface RoomInvite {
  id: string;
  room_id: string;
  created_by: string;
  invite_code: string;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  created_at: string;
}

// ============ NEW LEARNING PLATFORM TYPES ============

// Subjects
export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  total_lessons: number;
  created_at: string;
}

export interface UserSubjectProgress {
  id: string;
  user_id: string;
  subject_id: string;
  lessons_completed: number;
  quizzes_completed: number;
  total_quizzes_passed: number;
  total_study_time: number;
  mastery_percentage: number;
  average_score: number;
  weakest_topic: string | null;
  strongest_topic: string | null;
  last_studied_at: string | null;
  created_at: string;
  updated_at: string;
  subjects?: Subject;
}

// Lessons
export interface Lesson {
  id: string;
  subject_id: string;
  title: string;
  slug: string;
  description: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_minutes: number;
  objectives: string[];
  simple_explanation: string | null;
  detailed_explanation: string | null;
  examples: { title: string; content: string }[];
  common_mistakes: string[];
  memory_tips: string[];
  practice_questions: { question: string; answer: string }[];
  summary: string | null;
  order_index: number;
  prerequisites: string[];
  created_at: string;
  updated_at: string;
  subjects?: Subject;
}

export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  started_at: string;
  completed_at: string | null;
  time_spent: number;
  explanations_viewed: string[];
  flashcards_reviewed: boolean;
  quiz_taken: boolean;
  mastery_level: number;
  notes: string | null;
  lessons?: Lesson;
}

// Quizzes
export interface Quiz {
  id: string;
  lesson_id: string | null;
  subject_id: string;
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  time_limit: number;
  passing_score: number;
  questions: QuizQuestionData[];
  created_at: string;
  subjects?: Subject;
  lessons?: Lesson;
}

export interface QuizQuestionData {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank';
  options?: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number | null;
  answers: {
    question_id: string;
    answer: string;
    is_correct: boolean;
    points_earned: number;
  }[];
  strengths: string[];
  weaknesses: string[];
  topics_to_review: string[];
  difficulty_adjusted: boolean;
  started_at: string;
  completed_at: string | null;
  xp_earned: number;
  quizzes?: Quiz;
}

// Flashcards
export interface Flashcard {
  id: string;
  lesson_id: string | null;
  subject_id: string;
  front: string;
  back: string;
  hints: string[];
  difficulty: string;
  created_at: string;
}

export interface FlashcardReview {
  id: string;
  user_id: string;
  flashcard_id: string;
  times_reviewed: number;
  times_correct: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  ease_factor: number;
  interval_days: number;
  flashcards?: Flashcard;
}

// Learning Memory
export interface LearningMemory {
  id: string;
  user_id: string;
  subjects_studied: string[];
  mastered_topics: string[];
  struggling_topics: string[];
  frequent_mistakes: { topic: string; mistake: string; count: number }[];
  preferred_explanation_style: 'simple' | 'detailed' | 'example-heavy' | 'visual';
  learning_speed: 'slow' | 'moderate' | 'fast';
  confidence_level: number;
  total_xp: number;
  current_level: number;
  daily_goal: number;
  weekly_goal: number;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  study_preferences: Json;
  created_at: string;
  updated_at: string;
}

// AI Conversations
export interface AIConversation {
  id: string;
  user_id: string;
  conversation_type: string;
  messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
  context: Json;
  lesson_id: string | null;
  created_at: string;
  updated_at: string;
}

// Study Planner
export interface StudyPlan {
  id: string;
  user_id: string;
  date: string;
  sessions: {
    id: string;
    subject_id: string;
    lesson_id: string | null;
    duration_minutes: number;
    type: 'lesson' | 'quiz' | 'flashcard' | 'review';
    completed: boolean;
    completed_at: string | null;
  }[];
  ai_generated: boolean;
  completed_sessions: number;
  total_minutes: number;
  completed_minutes: number;
  created_at: string;
}

// XP & Activity History
export interface XPHistory {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  description: string | null;
  metadata: Json;
  created_at: string;
}

export interface ActivityHistory {
  id: string;
  user_id: string;
  activity_type: string;
  description: string | null;
  metadata: Json;
  xp_earned: number;
  created_at: string;
}
