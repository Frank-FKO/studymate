import { useState, useEffect } from 'react';
import { useLearning } from '../contexts/LearningContext';
import { supabase } from '../lib/supabase';
import { Lesson, Subject, UserSubjectProgress } from '../lib/supabase';
import { LessonView } from '../components/LessonView';
import {
  GraduationCap, BookOpen, Brain, Trophy, Clock, Flame, Target,
  ChevronRight, Star, CheckCircle, Lock, Play, ArrowLeft,
  BarChart3, Zap, TrendingUp, Calendar, Award, Search, Filter,
  Wand2, Loader2, Sparkles
} from 'lucide-react';

interface LearnPageProps {
  onBack: () => void;
}

interface GeneratedLesson {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_minutes: number;
  isGenerated: boolean;
}
const subjectImages: Record<string, string> = {
  mathematics: 'https://images.pexels.com/photos/6256062/pexels-photo-6256062.jpeg?auto=compress&cs=tinysrgb&w=600',
  physics: 'https://images.pexels.com/photos/2598244/pexels-photo-2598244.jpeg?auto=compress&cs=tinysrgb&w=600',
  chemistry: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=600',
  biology: 'https://images.pexels.com/photos/2087275/pexels-photo-2087275.jpeg?auto=compress&cs=tinysrgb&w=600',
  history: 'https://images.pexels.com/photos/2156108/pexels-photo-2156108.jpeg?auto=compress&cs=tinysrgb&w=600',
  literature: 'https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=600',
  'computer-science': 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=600',
  economics: 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&w=600',
  psychology: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=600',
  geography: 'https://images.pexels.com/photos/1279813/pexels-photo-1279813.jpeg?auto=compress&cs=tinysrgb&w=600',
};

type View = 'subjects' | 'lessons' | 'lesson_detail';

export function LearnPage({ onBack }: LearnPageProps) {
  const {
    subjects, subjectProgress, learningMemory, dashboardStats,
    loading, loadLesson, currentLesson
  } = useLearning();

  const [view, setView] = useState<View>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [generatedLessons, setGeneratedLessons] = useState<GeneratedLesson[]>([]);

  useEffect(() => {
    if (selectedSubject) {
      fetchLessons(selectedSubject.id);
    }
  }, [selectedSubject]);

  async function fetchLessons(subjectId: string) {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('subject_id', subjectId)
      .order('order_index');

    if (data) setLessons(data);
  }

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setView('lessons');
  };

  const handleSelectLesson = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setView('lesson_detail');
  };

  const handleLessonComplete = () => {
    setView('lessons');
    setSelectedLesson(null);
    if (selectedSubject) {
      fetchLessons(selectedSubject.id);
    }
  };

  // Generate AI lesson
  const generateAILesson = async () => {
    if (!selectedSubject) return;

    setGeneratingLesson(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/lesson-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          subject: selectedSubject.name,
          topic: `${selectedSubject.name} - ${['Advanced Concepts', 'Practical Applications', 'Key Fundamentals', 'Modern Approaches', 'Essential Knowledge'][Math.floor(Math.random() * 5)]}`,
          difficulty: difficultyFilter !== 'all' ? difficultyFilter : ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate lesson');

      const data = await response.json();

      if (data.lesson) {
        // Add to generated lessons
        const newLesson: GeneratedLesson = {
          id: `gen-${Date.now()}`,
          title: data.lesson.title,
          description: data.lesson.description,
          difficulty: data.lesson.difficulty,
          estimated_minutes: data.lesson.estimated_minutes,
          isGenerated: true,
        };

        setGeneratedLessons(prev => [newLesson, ...prev]);

        // Store the full lesson data for viewing
        const fullLesson = {
          ...data.lesson,
          id: newLesson.id,
          subject_id: selectedSubject.id,
          slug: data.lesson.title.toLowerCase().replace(/\s+/g, '-'),
          order_index: 999,
        };

        setSelectedLesson(fullLesson as Lesson);
        setView('lesson_detail');
      }
    } catch (error) {
      console.error('Error generating lesson:', error);
    } finally {
      setGeneratingLesson(false);
    }
  };

  const getProgress = (subjectId: string): UserSubjectProgress | undefined => {
    return subjectProgress.find(p => p.subject_id === subjectId);
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || lesson.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Lesson Detail View
  if (view === 'lesson_detail' && selectedLesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LessonView
          lessonId={selectedLesson.id}
          onComplete={handleLessonComplete}
          onBack={() => {
            setView('lessons');
            setSelectedLesson(null);
          }}
        />
      </div>
    );
  }

  // Lessons List View
  if (view === 'lessons' && selectedSubject) {
    const progress = getProgress(selectedSubject.id);
    const lessonsCompleted = progress?.lessons_completed || 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => {
                setView('subjects');
                setSelectedSubject(null);
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Subjects
            </button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedSubject.name}</h1>
                <p className="text-gray-500 mt-1">{selectedSubject.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">{progress?.mastery_percentage || 0}%</div>
                <div className="text-sm text-gray-500">Mastery</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">{lessonsCompleted} of {lessons.length} lessons completed</span>
                <span className="text-gray-500">{Math.round((lessonsCompleted / Math.max(lessons.length, 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${(lessonsCompleted / Math.max(lessons.length, 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="input-field w-40"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button
              onClick={generateAILesson}
              disabled={generatingLesson}
              className="btn-primary flex items-center gap-2"
              title="Generate a new AI-powered lesson"
            >
              {generatingLesson ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {generatingLesson ? 'Generating...' : 'AI Generate'}
            </button>
          </div>

          {/* Generated Lessons Section */}
          {generatedLessons.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">AI-Generated Lessons</span>
              </div>
              <div className="space-y-2">
                {generatedLessons.map(lesson => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson as unknown as Lesson)}
                    className="w-full bg-white rounded-lg p-3 flex items-center gap-3 hover:shadow-md transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{lesson.title}</p>
                      <p className="text-sm text-gray-500">{lesson.estimated_minutes} min - {lesson.difficulty}</p>
                    </div>
                    <span className="text-xs text-primary-600 bg-primary-100 px-2 py-1 rounded-full">AI</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lessons Grid */}
          {filteredLessons.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No lessons found for this subject.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className="w-full bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all text-left group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    index < lessonsCompleted
                      ? 'bg-success-100 text-success-600'
                      : index === lessonsCompleted
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index < lessonsCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : index === lessonsCompleted ? (
                      <Play className="w-5 h-5" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{lesson.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        lesson.difficulty === 'beginner' ? 'bg-success-100 text-success-700' :
                        lesson.difficulty === 'intermediate' ? 'bg-warning-100 text-warning-700' :
                        'bg-error-100 text-error-700'
                      }`}>
                        {lesson.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{lesson.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {lesson.estimated_minutes}m
                    </span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Subjects View (Default)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learn</h1>
              <p className="text-gray-500">Choose a subject to start learning</p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{learningMemory?.total_xp || 0}</div>
                <div className="text-xs text-gray-500">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-600">{learningMemory?.current_streak || 0}</div>
                <div className="text-xs text-gray-500">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">
                  {subjectProgress.filter(p => p.mastery_percentage >= 70).length}
                </div>
                <div className="text-xs text-gray-500">Mastered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Subject */}
        {dashboardStats.weakestSubject && (
          <div className="mb-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-primary-200 text-sm mb-1">Recommended for You</div>
                <h3 className="text-xl font-bold mb-2">Focus on {dashboardStats.weakestSubject.name}</h3>
                <p className="text-primary-100 text-sm">
                  This is your weakest subject. Let's improve it together!
                </p>
              </div>
              <button
                onClick={() => handleSelectSubject(dashboardStats.weakestSubject!)}
                className="bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
              >
                Start Learning
              </button>
            </div>
          </div>
        )}

        {/* Subjects Grid */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(subject => {
            const progress = getProgress(subject.id);
            const mastery = progress?.mastery_percentage || 0;
            const lessonsCompleted = progress?.lessons_completed || 0;

            return (
              <button
                key={subject.id}
                onClick={() => handleSelectSubject(subject)}
                className="bg-white rounded-2xl overflow-hidden text-left hover:shadow-xl transition-all group"
              >
                {/* Subject Image */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={subjectImages[subject.slug] || subjectImages.mathematics}
                    alt={subject.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {mastery >= 70 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-success-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Mastered
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white mb-0.5">{subject.name}</h3>
                    <p className="text-white/70 text-sm line-clamp-1">{subject.description}</p>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{lessonsCompleted} lessons</span>
                    <span className={`text-sm font-medium ${
                      mastery >= 70 ? 'text-success-600' :
                      mastery > 30 ? 'text-primary-600' : 'text-warning-600'
                    }`}>
                      {Math.round(mastery)}% Mastery
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        mastery >= 70 ? 'bg-success-500' :
                        mastery > 30 ? 'bg-primary-500' : 'bg-warning-500'
                      }`}
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
