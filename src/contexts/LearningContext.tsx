import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  Profile, Subject, UserSubjectProgress, Lesson, UserLessonProgress,
  Quiz, QuizAttempt, Flashcard, FlashcardReview, LearningMemory,
  StudyPlan, XPHistory, ActivityHistory, AIConversation
} from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface LearningContextType {
  // User data
  profile: Profile | null;
  learningMemory: LearningMemory | null;

  // Subjects
  subjects: Subject[];
  subjectProgress: UserSubjectProgress[];
  currentSubject: Subject | null;
  setCurrentSubject: (subject: Subject | null) => void;

  // Lessons
  currentLesson: Lesson | null;
  lessonProgress: UserLessonProgress | null;
  loadLesson: (lessonId: string) => Promise<Lesson | null>;
  startLesson: (lessonId: string) => Promise<void>;
  completeLesson: (lessonId: string, timeSpent: number) => Promise<void>;

  // Quizzes
  currentQuiz: Quiz | null;
  quizAttempts: QuizAttempt[];
  loadQuiz: (quizId: string) => Promise<Quiz | null>;
  startQuizAttempt: (quizId: string) => Promise<QuizAttempt | null>;
  submitQuizAnswer: (attemptId: string, questionId: string, answer: string) => Promise<void>;
  completeQuizAttempt: (attemptId: string) => Promise<QuizAttempt | null>;

  // Flashcards
  flashcards: Flashcard[];
  flashcardReviews: FlashcardReview[];
  loadFlashcards: (subjectId: string) => Promise<void>;
  reviewFlashcard: (flashcardId: string, correct: boolean) => Promise<void>;

  // Study Planner
  todayPlan: StudyPlan | null;
  loadStudyPlan: (date: string) => Promise<StudyPlan | null>;
  generateStudyPlan: () => Promise<StudyPlan | null>;
  completeStudySession: (sessionId: string) => Promise<void>;

  // XP & Activity
  addXP: (amount: number, source: string, description?: string) => Promise<void>;
  logActivity: (type: string, description: string, metadata?: object) => Promise<void>;
  recentActivities: ActivityHistory[];
  xpHistory: XPHistory[];

  // AI Memory
  aiConversation: AIConversation | null;
  loadAIConversation: (conversationId: string) => Promise<void>;
  addAIMessage: (role: 'user' | 'assistant', content: string) => Promise<void>;

  // Dashboard Stats
  dashboardStats: DashboardStats;

  // Loading states
  loading: boolean;
  refresh: () => Promise<void>;
}

interface DashboardStats {
  currentXP: number;
  currentLevel: number;
  dailyGoal: number;
  weeklyGoal: number;
  dailyProgress: number;
  weeklyProgress: number;
  studyStreak: number;
  averageQuizScore: number;
  timeStudiedToday: number;
  upcomingSession: { subject: string; topic: string } | null;
  recommendedLesson: Lesson | null;
  recommendedQuiz: Quiz | null;
  weakestSubject: Subject | null;
  strongestSubject: Subject | null;
  latestAchievement: { name: string; icon: string } | null;
}

const LearningContext = createContext<LearningContextType | null>(null);

export function LearningProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  // Core state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [learningMemory, setLearningMemory] = useState<LearningMemory | null>(null);
  const [loading, setLoading] = useState(true);

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<UserSubjectProgress[]>([]);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);

  // Lessons
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<UserLessonProgress | null>(null);

  // Quizzes
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);

  // Flashcards
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardReviews, setFlashcardReviews] = useState<FlashcardReview[]>([]);

  // Study Planner
  const [todayPlan, setTodayPlan] = useState<StudyPlan | null>(null);

  // XP & Activity
  const [recentActivities, setRecentActivities] = useState<ActivityHistory[]>([]);
  const [xpHistory, setXPHistory] = useState<XPHistory[]>([]);

  // AI
  const [aiConversation, setAIConversation] = useState<AIConversation | null>(null);

  // Dashboard Stats
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    currentXP: 0,
    currentLevel: 1,
    dailyGoal: 30,
    weeklyGoal: 180,
    dailyProgress: 0,
    weeklyProgress: 0,
    studyStreak: 0,
    averageQuizScore: 0,
    timeStudiedToday: 0,
    upcomingSession: null,
    recommendedLesson: null,
    recommendedQuiz: null,
    weakestSubject: null,
    strongestSubject: null,
    latestAchievement: null,
  });

  // Initialize data on user change
  useEffect(() => {
    if (user) {
      initializeLearning();
      setupRealtimeSubscriptions();
    } else {
      cleanupRealtimeSubscriptions();
      resetState();
    }

    return () => {
      cleanupRealtimeSubscriptions();
    };
  }, [user]);

  // Setup realtime subscriptions
  function setupRealtimeSubscriptions() {
    if (!user) return;

    // Clean up any existing channels
    cleanupRealtimeSubscriptions();

    // Profile changes
    const profileChannel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();
    channelsRef.current.push(profileChannel);

    // Learning memory changes
    const memoryChannel = supabase
      .channel(`memory:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'learning_memory', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setLearningMemory(payload.new as LearningMemory);
          }
        }
      )
      .subscribe();
    channelsRef.current.push(memoryChannel);

    // Subject progress changes
    const progressChannel = supabase
      .channel(`progress:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_subject_progress', filter: `user_id=eq.${user.id}` },
        async () => {
          // Refetch progress
          const { data } = await supabase
            .from('user_subject_progress')
            .select('*, subjects(*)')
            .eq('user_id', user!.id);
          if (data) setSubjectProgress(data);
        }
      )
      .subscribe();
    channelsRef.current.push(progressChannel);

    // Activity history changes
    const activityChannel = supabase
      .channel(`activities:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_history', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setRecentActivities(prev => [payload.new as ActivityHistory, ...prev].slice(0, 10));
        }
      )
      .subscribe();
    channelsRef.current.push(activityChannel);

    // XP history changes
    const xpChannel = supabase
      .channel(`xp:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'xp_history', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setXPHistory(prev => [payload.new as XPHistory, ...prev].slice(0, 20));
        }
      )
      .subscribe();
    channelsRef.current.push(xpChannel);

    // Lesson progress changes
    const lessonProgressChannel = supabase
      .channel(`lesson_progress:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_lesson_progress', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setLessonProgress(payload.new as UserLessonProgress);
          }
        }
      )
      .subscribe();
    channelsRef.current.push(lessonProgressChannel);

    // Study plan changes
    const studyPlanChannel = supabase
      .channel(`study_plan:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_plans', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setTodayPlan(payload.new as StudyPlan);
          }
        }
      )
      .subscribe();
    channelsRef.current.push(studyPlanChannel);

    // Achievements changes
    const achievementsChannel = supabase
      .channel(`achievements:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_achievements', filter: `user_id=eq.${user.id}` },
        async () => {
          await updateDashboardStats();
        }
      )
      .subscribe();
    channelsRef.current.push(achievementsChannel);
  }

  function cleanupRealtimeSubscriptions() {
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
  }

  async function initializeLearning() {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) setProfile(profileData);

      // Get or create learning memory
      const { data: memoryData } = await supabase
        .from('learning_memory')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memoryData) {
        setLearningMemory(memoryData);
      } else {
        // Create initial learning memory
        const { data: newMemory } = await supabase
          .from('learning_memory')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (newMemory) setLearningMemory(newMemory);
      }

      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (subjectsData) setSubjects(subjectsData);

      // Fetch user subject progress
      const { data: progressData } = await supabase
        .from('user_subject_progress')
        .select('*, subjects(*)')
        .eq('user_id', user.id);

      if (progressData) setSubjectProgress(progressData);

      // Fetch recent activities
      const { data: activitiesData } = await supabase
        .from('activity_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesData) setRecentActivities(activitiesData);

      // Fetch XP history
      const { data: xpData } = await supabase
        .from('xp_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (xpData) setXPHistory(xpData);

      // Load today's study plan
      const today = new Date().toISOString().split('T')[0];
      const todayPlanData = await loadStudyPlan(today);

      // Calculate dashboard stats
      await updateDashboardStats();

    } catch (error) {
      console.error('Error initializing learning:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetState() {
    setProfile(null);
    setLearningMemory(null);
    setSubjects([]);
    setSubjectProgress([]);
    setCurrentSubject(null);
    setCurrentLesson(null);
    setLessonProgress(null);
    setCurrentQuiz(null);
    setQuizAttempts([]);
    setFlashcards([]);
    setFlashcardReviews([]);
    setTodayPlan(null);
    setRecentActivities([]);
    setXPHistory([]);
    setAIConversation(null);
    setLoading(false);
  }

  // Lesson Functions
  const loadLesson = useCallback(async (lessonId: string) => {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('*, subjects(*)')
      .eq('id', lessonId)
      .single();

    if (lesson) {
      setCurrentLesson(lesson as Lesson);

      // Check user progress
      const { data: progress } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user!.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (progress) setLessonProgress(progress);

      return lesson as Lesson;
    }
    return null;
  }, [user]);

  const startLesson = useCallback(async (lessonId: string) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (!existing) {
      const { data: progress } = await supabase
        .from('user_lesson_progress')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (progress) setLessonProgress(progress);
    } else {
      setLessonProgress(existing);
    }
  }, [user]);

  const completeLesson = useCallback(async (lessonId: string, timeSpent: number) => {
    if (!user || !lessonProgress) return;

    await supabase
      .from('user_lesson_progress')
      .update({
        completed_at: new Date().toISOString(),
        time_spent: timeSpent,
        mastery_level: 70,
      })
      .eq('id', lessonProgress.id);

    // Award XP
    const xp = Math.floor(timeSpent / 60) * 5 + 20;
    await addXP(xp, 'lesson_complete', 'Completed a lesson');

    // Log activity
    await logActivity('lesson_complete', 'Completed a lesson', { lesson_id: lessonId, time_spent: timeSpent });

    // Update subject progress
    if (currentLesson?.subject_id) {
      await updateSubjectProgress(currentLesson.subject_id);
    }

    await refresh();
  }, [user, lessonProgress, currentLesson]);

  // Quiz Functions
  const loadQuiz = useCallback(async (quizId: string) => {
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('*, subjects(*), lessons(*)')
      .eq('id', quizId)
      .single();

    if (quiz) {
      setCurrentQuiz(quiz as Quiz);
      return quiz as Quiz;
    }
    return null;
  }, []);

  const startQuizAttempt = useCallback(async (quizId: string) => {
    if (!user) return null;

    const { data: attempt } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        total_questions: currentQuiz?.questions.length || 0,
        answers: [],
      })
      .select()
      .single();

    return attempt;
  }, [user, currentQuiz]);

  const submitQuizAnswer = useCallback(async (
    attemptId: string,
    questionId: string,
    answer: string
  ) => {
    if (!currentQuiz) return;

    const question = currentQuiz.questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = answer.toLowerCase() === question.correct_answer.toLowerCase();
    const pointsEarned = isCorrect ? question.points : 0;

    // Update attempt
    const { data: attempt } = await supabase
      .from('quiz_attempts')
      .select('answers, score, correct_answers')
      .eq('id', attemptId)
      .single();

    if (attempt) {
      const newAnswers = [...(attempt.answers || []), {
        question_id: questionId,
        answer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      }];

      await supabase
        .from('quiz_attempts')
        .update({
          answers: newAnswers,
          score: attempt.score + pointsEarned,
          correct_answers: attempt.correct_answers + (isCorrect ? 1 : 0),
        })
        .eq('id', attemptId);
    }
  }, [currentQuiz]);

  const completeQuizAttempt = useCallback(async (attemptId: string) => {
    if (!user || !currentQuiz) return null;

    const { data: attempt } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (!attempt) return null;

    const score = Math.round((attempt.correct_answers / attempt.total_questions) * 100);

    // Calculate strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    attempt.answers.forEach((a: { question_id: string; is_correct: boolean }) => {
      const q = currentQuiz.questions.find(q => q.id === a.question_id);
      if (q) {
        if (a.is_correct) {
          strengths.push(q.question.substring(0, 50));
        } else {
          weaknesses.push(q.question.substring(0, 50));
        }
      }
    });

    // Calculate XP
    const xpEarned = Math.floor(score / 10) * 5;

    await supabase
      .from('quiz_attempts')
      .update({
        completed_at: new Date().toISOString(),
        strengths,
        weaknesses,
        xp_earned: xpEarned,
      })
      .eq('id', attemptId);

    // Add XP
    await addXP(xpEarned, 'quiz_complete', `Scored ${score}% on quiz`);

    // Log activity
    await logActivity('quiz_complete', `Completed quiz with ${score}% score`, {
      quiz_id: currentQuiz.id,
      score,
    });

    // Update subject progress
    if (currentQuiz.subject_id) {
      await updateSubjectProgress(currentQuiz.subject_id);
    }

    // Update learning memory
    await updateLearningMemory(score, currentQuiz.subject_id);

    await refresh();

    return { ...attempt, score, xp_earned: xpEarned };
  }, [user, currentQuiz]);

  // Flashcard Functions
  const loadFlashcards = useCallback(async (subjectId: string) => {
    const { data: cards } = await supabase
      .from('flashcards')
      .select('*')
      .eq('subject_id', subjectId);

    if (cards) setFlashcards(cards);

    if (user) {
      const { data: reviews } = await supabase
        .from('flashcard_reviews')
        .select('*, flashcards(*)')
        .eq('user_id', user.id)
        .in('flashcard_id', (cards || []).map(c => c.id));

      if (reviews) setFlashcardReviews(reviews);
    }
  }, [user]);

  const reviewFlashcard = useCallback(async (flashcardId: string, correct: boolean) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('flashcard_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('flashcard_id', flashcardId)
      .maybeSingle();

    const now = new Date();

    if (existing) {
      // Update with spaced repetition
      const newEaseFactor = correct
        ? existing.ease_factor + 0.1
        : Math.max(1.3, existing.ease_factor - 0.2);

      const newInterval = correct
        ? Math.round(existing.interval_days * newEaseFactor)
        : 1;

      const nextReview = new Date(now);
      nextReview.setDate(nextReview.getDate() + newInterval);

      await supabase
        .from('flashcard_reviews')
        .update({
          times_reviewed: existing.times_reviewed + 1,
          times_correct: existing.times_correct + (correct ? 1 : 0),
          last_reviewed_at: now.toISOString(),
          next_review_at: nextReview.toISOString(),
          ease_factor: newEaseFactor,
          interval_days: newInterval,
        })
        .eq('id', existing.id);
    } else {
      // Create new review
      const nextReview = new Date(now);
      nextReview.setDate(nextReview.getDate() + (correct ? 2 : 1));

      await supabase
        .from('flashcard_reviews')
        .insert({
          user_id: user.id,
          flashcard_id: flashcardId,
          times_reviewed: 1,
          times_correct: correct ? 1 : 0,
          last_reviewed_at: now.toISOString(),
          next_review_at: nextReview.toISOString(),
        });
    }

    // Award XP
    await addXP(correct ? 3 : 1, 'flashcard_review');
  }, [user]);

  // Study Planner
  const loadStudyPlan = useCallback(async (date: string) => {
    if (!user) return null;

    const { data: plan } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle();

    if (plan) {
      setTodayPlan(plan);
      return plan;
    }
    return null;
  }, [user]);

  const generateStudyPlan = useCallback(async () => {
    if (!user || !learningMemory || subjects.length === 0) return null;

    // Find weakest subjects
    const weakSubjects = subjectProgress
      .filter(p => p.mastery_percentage < 50)
      .sort((a, b) => a.mastery_percentage - b.mastery_percentage)
      .slice(0, 3);

    // Generate AI-recommended sessions
    const sessions = [];
    const today = new Date();

    // Morning: Focus on weakest topic
    if (weakSubjects.length > 0) {
      sessions.push({
        id: crypto.randomUUID(),
        subject_id: weakSubjects[0].subject_id,
        lesson_id: null,
        duration_minutes: 30,
        type: 'lesson',
        completed: false,
        completed_at: null,
      });
    }

    // Afternoon: Quiz
    if (weakSubjects.length > 1) {
      sessions.push({
        id: crypto.randomUUID(),
        subject_id: weakSubjects[1].subject_id,
        lesson_id: null,
        duration_minutes: 20,
        type: 'quiz',
        completed: false,
        completed_at: null,
      });
    }

    // Evening: Flashcard review
    sessions.push({
      id: crypto.randomUUID(),
      subject_id: subjects[0]?.id || '',
      lesson_id: null,
      duration_minutes: 15,
      type: 'flashcard',
      completed: false,
      completed_at: null,
    });

    const todayStr = today.toISOString().split('T')[0];

    const { data: plan } = await supabase
      .from('study_plans')
      .upsert({
        user_id: user.id,
        date: todayStr,
        sessions,
        ai_generated: true,
        total_minutes: sessions.reduce((sum, s) => sum + s.duration_minutes, 0),
      })
      .select()
      .single();

    if (plan) {
      setTodayPlan(plan);
      return plan;
    }
    return null;
  }, [user, learningMemory, subjects, subjectProgress]);

  const completeStudySession = useCallback(async (sessionId: string) => {
    if (!user || !todayPlan) return;

    const updatedSessions = todayPlan.sessions.map(s =>
      s.id === sessionId
        ? { ...s, completed: true, completed_at: new Date().toISOString() }
        : s
    );

    const completedMinutes = updatedSessions
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.duration_minutes, 0);

    await supabase
      .from('study_plans')
      .update({
        sessions: updatedSessions,
        completed_sessions: updatedSessions.filter(s => s.completed).length,
        completed_minutes: completedMinutes,
      })
      .eq('id', todayPlan.id);

    // Award XP
    const session = todayPlan.sessions.find(s => s.id === sessionId);
    if (session) {
      await addXP(session.duration_minutes, 'study_session', 'Completed a study session');
      await logActivity('study_session', `Completed ${session.duration_minutes} minute study session`, {
        subject_id: session.subject_id,
        type: session.type,
      });
    }

    await refresh();
  }, [user, todayPlan]);

  // XP & Activity
  const addXP = useCallback(async (amount: number, source: string, description?: string) => {
    if (!user) return;

    await supabase.from('xp_history').insert({
      user_id: user.id,
      amount,
      source,
      description,
    });

    // Update profile XP
    await supabase.rpc('add_user_xp', { user_id: user.id, amount });

    // Update learning memory
    if (learningMemory) {
      await supabase
        .from('learning_memory')
        .update({
          total_xp: learningMemory.total_xp + amount,
          current_level: Math.floor((learningMemory.total_xp + amount) / 1000) + 1,
        })
        .eq('user_id', user.id);
    }

    // Update profile state
    if (profile) {
      setProfile({ ...profile, xp: profile.xp + amount });
    }

    // Check for achievements
    await checkAchievements();
  }, [user, learningMemory, profile]);

  const logActivity = useCallback(async (type: string, description: string, metadata: object = {}) => {
    if (!user) return;

    await supabase.from('activity_history').insert({
      user_id: user.id,
      activity_type: type,
      description,
      metadata,
    });
  }, [user]);

  // AI Conversation
  const loadAIConversation = useCallback(async (conversationId: string) => {
    const { data: conv } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (conv) setAIConversation(conv);
  }, []);

  const addAIMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!user || !aiConversation) return;

    const newMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...(aiConversation.messages || []), newMessage];

    await supabase
      .from('ai_conversations')
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq('id', aiConversation.id);

    setAIConversation({ ...aiConversation, messages: updatedMessages });
  }, [user, aiConversation]);

  // Helper Functions
  async function updateSubjectProgress(subjectId: string) {
    if (!user) return;

    // Get or create progress record
    const { data: existing } = await supabase
      .from('user_subject_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('subject_id', subjectId)
      .maybeSingle();

    // Calculate stats
    const { data: lessons } = await supabase
      .from('user_lesson_progress')
      .select('*, lessons!inner(subject_id)')
      .eq('user_id', user.id);

    const { data: quizzes } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes!inner(subject_id)')
      .eq('user_id', user.id);

    const subjectLessons = (lessons || []).filter(
      (l: { lessons: { subject_id: string } }) => l.lessons.subject_id === subjectId
    );
    const subjectQuizzes = (quizzes || []).filter(
      (q: { quizzes: { subject_id: string } }) => q.quizzes.subject_id === subjectId
    );

    const lessonsCompleted = subjectLessons.filter((l: { completed_at: string | null }) => l.completed_at).length;
    const quizzesCompleted = subjectQuizzes.filter((q: { completed_at: string | null }) => q.completed_at).length;
    const quizzesPassed = subjectQuizzes.filter(
      (q: { score: number, quizzes: { passing_score: number } }) => q.score >= q.quizzes.passing_score
    ).length;

    const avgScore = subjectQuizzes.length > 0
      ? subjectQuizzes.reduce((sum: number, q: { score: number }) => sum + q.score, 0) / subjectQuizzes.length
      : 0;

    const totalStudyTime = subjectLessons.reduce(
      (sum: number, l: { time_spent: number }) => sum + (l.time_spent || 0), 0
    );

    const masteryPercentage = Math.min(100,
      (lessonsCompleted * 10) + (quizzesPassed * 15) + (avgScore / 5)
    );

    if (existing) {
      await supabase
        .from('user_subject_progress')
        .update({
          lessons_completed: lessonsCompleted,
          quizzes_completed: quizzesCompleted,
          total_quizzes_passed: quizzesPassed,
          average_score: avgScore,
          total_study_time: totalStudyTime,
          mastery_percentage: masteryPercentage,
          last_studied_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('user_subject_progress')
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          lessons_completed: lessonsCompleted,
          quizzes_completed: quizzesCompleted,
          total_quizzes_passed: quizzesPassed,
          average_score: avgScore,
          total_study_time: totalStudyTime,
          mastery_percentage: masteryPercentage,
          last_studied_at: new Date().toISOString(),
        });
    }
  }

  async function updateLearningMemory(score: number, subjectId: string) {
    if (!user || !learningMemory) return;

    // Update struggling or mastered topics
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    let masteredTopics = [...(learningMemory.mastered_topics || [])];
    let strugglingTopics = [...(learningMemory.struggling_topics || [])];

    if (score >= 80) {
      if (!masteredTopics.includes(subject.name)) {
        masteredTopics.push(subject.name);
      }
      strugglingTopics = strugglingTopics.filter(t => t !== subject.name);
    } else if (score < 50) {
      if (!strugglingTopics.includes(subject.name)) {
        strugglingTopics.push(subject.name);
      }
      masteredTopics = masteredTopics.filter(t => t !== subject.name);
    }

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    let currentStreak = learningMemory.current_streak;

    if (learningMemory.last_study_date === today) {
      // Already studied today, streak stays same
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (learningMemory.last_study_date === yesterdayStr) {
        currentStreak += 1;
      } else if (learningMemory.last_study_date !== today) {
        currentStreak = 1;
      }
    }

    await supabase
      .from('learning_memory')
      .update({
        mastered_topics: masteredTopics,
        struggling_topics: strugglingTopics,
        current_streak: currentStreak,
        longest_streak: Math.max(learningMemory.longest_streak, currentStreak),
        last_study_date: today,
        confidence_level: Math.max(0, Math.min(100,
          learningMemory.confidence_level + (score >= 70 ? 5 : -5)
        )),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }

  async function updateDashboardStats() {
    if (!user || !learningMemory) return;

    // Calculate daily progress
    const today = new Date().toISOString().split('T')[0];
    const { data: todayActivities } = await supabase
      .from('activity_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today);

    let timeStudiedToday = 0;
    (todayActivities || []).forEach((a: { activity_type: string; metadata: { time_spent?: number; duration_minutes?: number } }) => {
      if (a.activity_type === 'lesson_complete' && a.metadata?.time_spent) {
        timeStudiedToday += a.metadata.time_spent / 60;
      }
      if (a.activity_type === 'study_session' && a.metadata?.duration_minutes) {
        timeStudiedToday += a.metadata.duration_minutes;
      }
    });

    // Find weakest/strongest subjects
    const sortedProgress = [...subjectProgress].sort((a, b) =>
      a.mastery_percentage - b.mastery_percentage
    );

    const weakestSubject = sortedProgress[0]?.subjects || null;
    const strongestSubject = sortedProgress[sortedProgress.length - 1]?.subjects || null;

    // Get recommended lesson
    let recommendedLesson: Lesson | null = null;
    if (sortedProgress.length > 0 && sortedProgress[0].mastery_percentage < 50) {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('subject_id', sortedProgress[0].subject_id)
        .eq('difficulty', 'beginner')
        .limit(1);

      if (lessons && lessons.length > 0) {
        recommendedLesson = lessons[0];
      }
    }

    // Calculate average quiz score
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('score')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null);

    const averageQuizScore = attempts && attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
      : 0;

    // Get latest achievement
    const { data: latestAchievement } = await supabase
      .from('user_achievements')
      .select('achievements(name, icon)')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setDashboardStats({
      currentXP: learningMemory.total_xp,
      currentLevel: learningMemory.current_level,
      dailyGoal: learningMemory.daily_goal,
      weeklyGoal: learningMemory.weekly_goal,
      dailyProgress: timeStudiedToday,
      weeklyProgress: timeStudiedToday * 7,
      studyStreak: learningMemory.current_streak,
      averageQuizScore,
      timeStudiedToday,
      upcomingSession: todayPlan?.sessions.find(s => !s.completed)?.subject_id
        ? { subject: subjects.find(s => s.id === todayPlan.sessions.find(s2 => !s2.completed)?.subject_id)?.name || '', topic: 'Session' }
        : null,
      recommendedLesson,
      recommendedQuiz: null,
      weakestSubject,
      strongestSubject,
      latestAchievement: latestAchievement?.achievements as { name: string; icon: string } | null,
    });
  }

  async function checkAchievements() {
    if (!user || !profile) return;

    const { data: achievements } = await supabase
      .from('achievements')
      .select('*');

    if (!achievements) return;

    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const earnedIds = new Set(userAchievements?.map(a => a.achievement_id) || []);

    for (const achievement of achievements) {
      if (earnedIds.has(achievement.id)) continue;

      let earned = false;

      switch (achievement.requirement_type) {
        case 'xp':
          earned = profile.xp >= achievement.requirement_value;
          break;
        case 'quizzes':
          earned = profile.quizzes_completed >= achievement.requirement_value;
          break;
        case 'study_time':
          earned = profile.total_study_time >= achievement.requirement_value;
          break;
        case 'streak':
          earned = (learningMemory?.current_streak || 0) >= achievement.requirement_value;
          break;
      }

      if (earned) {
        await supabase.from('user_achievements').insert({
          user_id: user.id,
          achievement_id: achievement.id,
        });

        await addXP(achievement.xp_reward, 'achievement', `Earned: ${achievement.display_name}`);
      }
    }
  }

  const refresh = useCallback(async () => {
    await initializeLearning();
  }, [user]);

  const value: LearningContextType = {
    profile,
    learningMemory,
    subjects,
    subjectProgress,
    currentSubject,
    setCurrentSubject,
    currentLesson,
    lessonProgress,
    loadLesson,
    startLesson,
    completeLesson,
    currentQuiz,
    quizAttempts,
    loadQuiz,
    startQuizAttempt,
    submitQuizAnswer,
    completeQuizAttempt,
    flashcards,
    flashcardReviews,
    loadFlashcards,
    reviewFlashcard,
    todayPlan,
    loadStudyPlan,
    generateStudyPlan,
    completeStudySession,
    addXP,
    logActivity,
    recentActivities,
    xpHistory,
    aiConversation,
    loadAIConversation,
    addAIMessage,
    dashboardStats,
    loading,
    refresh,
  };

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}
