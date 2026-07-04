import { useState, useEffect, useRef, useCallback } from 'react';
import { useLearning } from '../contexts/LearningContext';
import { Lesson, QuizQuestionData } from '../lib/supabase';
import {
  BookOpen, Clock, Target, Lightbulb, AlertTriangle, Brain,
  ChevronRight, CheckCircle, Play, ArrowLeft, RotateCcw,
  FileText, HelpCircle, Award, ChevronDown, ChevronUp, X,
  Volume2, VolumeX, Pause, Loader2
} from 'lucide-react';

interface LessonViewProps {
  lessonId: string;
  onComplete: () => void;
  onBack: () => void;
}

type LessonSection = 'objectives' | 'simple' | 'detailed' | 'examples' | 'mistakes' | 'tips' | 'practice' | 'summary';

const TTS_VOICES = [
  { id: 'autumn', name: 'Autumn', description: 'Warm and friendly' },
  { id: 'ember', name: 'Ember', description: 'Energetic and bright' },
  { id: 'luna', name: 'Luna', description: 'Calm and clear' },
];

export function LessonView({ lessonId, onComplete, onBack }: LessonViewProps) {
  const { loadLesson, startLesson, completeLesson, addXP, currentLesson, loading } = useLearning();
  const [activeSection, setActiveSection] = useState<LessonSection>('objectives');
  const [timeSpent, setTimeSpent] = useState(0);
  const [sectionsViewed, setSectionsViewed] = useState<Set<string>>(new Set());
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionData[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [lessonStarted, setLessonStarted] = useState(false);

  // Text-to-Speech state
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('autumn');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lessonId) {
      loadLesson(lessonId).then(() => {
        startLesson(lessonId);
        setLessonStarted(true);
      });
    }
  }, [lessonId]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const lesson = currentLesson;

  // Get text to speak based on active section
  const getTextToSpeak = useCallback(() => {
    if (!lesson) return '';

    switch (activeSection) {
      case 'objectives':
        return `Learning Objectives for ${lesson.title}. ${(lesson.objectives || []).join('. ')}`;
      case 'simple':
        return lesson.simple_explanation || '';
      case 'detailed':
        return lesson.detailed_explanation || '';
      case 'examples':
        return (lesson.examples || []).map((ex: { title: string; content: string }) => `${ex.title}: ${ex.content}`).join('. ');
      case 'mistakes':
        return `Common mistakes to avoid: ${(lesson.common_mistakes || []).join('. ')}`;
      case 'tips':
        return `Memory tips: ${(lesson.memory_tips || []).join('. ')}`;
      case 'practice':
        return (lesson.practice_questions || []).map((q: { question: string }) => q.question).join('. ');
      case 'summary':
        return lesson.summary || '';
      default:
        return '';
    }
  }, [lesson, activeSection]);

  // Text-to-Speech function
  const speakText = async () => {
    const text = getTextToSpeak();
    if (!text) return;

    setTtsLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
          response_format: 'wav'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.fallback) {
          // Use browser TTS as fallback
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          speechSynthesis.speak(utterance);
          setTtsPlaying(true);
          utterance.onend = () => setTtsPlaying(false);
        } else {
          throw new Error('TTS failed');
        }
        return;
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Create and play new audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setTtsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setTtsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      setTtsPlaying(true);

    } catch (error) {
      console.error('TTS error:', error);
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
      setTtsPlaying(true);
      utterance.onend = () => setTtsPlaying(false);
    } finally {
      setTtsLoading(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();
    setTtsPlaying(false);
  };

  const toggleTTS = () => {
    if (ttsPlaying) {
      stopSpeaking();
    } else {
      speakText();
    }
  };

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lessonId) {
      loadLesson(lessonId).then(() => {
        startLesson(lessonId);
        setLessonStarted(true);
      });
    }
  }, [lessonId]);

  if (loading || !lesson) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const markSectionViewed = (section: string) => {
    setSectionsViewed(prev => new Set([...prev, section]));
  };

  const handleSectionChange = (section: LessonSection) => {
    setActiveSection(section);
    markSectionViewed(section);
  };

  const handleComplete = async () => {
    await completeLesson(lessonId, timeSpent);
    onComplete();
  };

  const generateQuiz = async () => {
    // Generate quiz questions from lesson content
    const questions: QuizQuestionData[] = lesson.practice_questions?.slice(0, 5).map((q, i) => ({
      id: `q-${i}`,
      question: q.question,
      type: 'short_answer' as const,
      correct_answer: q.answer,
      explanation: `This question tests your understanding of ${lesson.title}.`,
      difficulty: 'medium' as const,
      points: 10,
    })) || [];

    if (questions.length === 0) {
      // Generate default questions based on lesson content
      questions.push({
        id: 'q-1',
        question: `What is the main concept of ${lesson.title}?`,
        type: 'short_answer',
        correct_answer: lesson.summary || '',
        explanation: lesson.simple_explanation || '',
        difficulty: 'easy',
        points: 10,
      });
    }

    setQuizQuestions(questions);
    setQuizMode(true);
    setCurrentQuestion(0);
    setQuizAnswers({});
  };

  const handleQuizAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz complete
      const correctCount = quizQuestions.filter((q, i) => {
        const userAnswer = quizAnswers[q.id] || (i === currentQuestion ? selectedAnswer : '');
        return userAnswer.toLowerCase().includes(q.correct_answer.toLowerCase().substring(0, 10));
      }).length;
      addXP(correctCount * 5, 'quiz', `Completed practice quiz: ${correctCount}/${quizQuestions.length} correct`);
      setQuizMode(false);
    }
  };

  const viewProgress = sectionsViewed.size;
  const totalSections = 8;
  const progressPercent = (viewProgress / totalSections) * 100;

  // Quiz Mode UI
  if (quizMode && quizQuestions.length > 0) {
    const question = quizQuestions[currentQuestion];
    const isCorrect = selectedAnswer?.toLowerCase().includes(question.correct_answer.toLowerCase().substring(0, 10));

    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setQuizMode(false)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lesson
            </button>
            <span className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {quizQuestions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{question.question}</h2>

          {!showExplanation ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Type your answer..."
                className="input-field w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                    handleQuizAnswer((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input') as HTMLInputElement;
                  if (input?.value) handleQuizAnswer(input.value);
                }}
                className="btn-primary w-full"
              >
                Submit Answer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 p-4 rounded-xl ${isCorrect ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
                {isCorrect ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span className="font-medium">{isCorrect ? 'Correct!' : 'Not quite right'}</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Correct Answer:</p>
                <p className="font-medium text-gray-900">{question.correct_answer}</p>
              </div>

              {question.explanation && (
                <div className="bg-primary-50 rounded-xl p-4">
                  <p className="text-sm text-primary-700">{question.explanation}</p>
                </div>
              )}

              <button onClick={handleNextQuestion} className="btn-primary w-full">
                {currentQuestion < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lesson View UI
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Lessons
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                lesson.difficulty === 'beginner' ? 'bg-success-100 text-success-700' :
                lesson.difficulty === 'intermediate' ? 'bg-warning-100 text-warning-700' :
                'bg-error-100 text-error-700'
              }`}>
                {lesson.difficulty}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lesson.estimated_minutes} min
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-gray-600 mt-2">{lesson.description}</p>
            )}
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Progress</div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2 flex-1">
          {[
            { id: 'objectives', label: 'Objectives', icon: Target },
            { id: 'simple', label: 'Quick Explanation', icon: Lightbulb },
            { id: 'detailed', label: 'Deep Dive', icon: BookOpen },
            { id: 'examples', label: 'Examples', icon: FileText },
            { id: 'mistakes', label: 'Common Mistakes', icon: AlertTriangle },
            { id: 'tips', label: 'Memory Tips', icon: Brain },
            { id: 'practice', label: 'Practice', icon: Play },
            { id: 'summary', label: 'Summary', icon: Award },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleSectionChange(id as LessonSection)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                activeSection === id
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : sectionsViewed.has(id)
                    ? 'bg-success-50 text-success-700'
                    : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {sectionsViewed.has(id) && activeSection !== id && (
                <CheckCircle className="w-3 h-3 text-success-500" />
              )}
            </button>
          ))}
        </div>

        {/* TTS Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <button
              onClick={() => setShowVoiceMenu(!showVoiceMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-xs"
              title="Change voice"
            >
              {selectedVoice}
            </button>
            {showVoiceMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 min-w-[140px]">
                {TTS_VOICES.map(voice => (
                  <button
                    key={voice.id}
                    onClick={() => {
                      setSelectedVoice(voice.id);
                      setShowVoiceMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${selectedVoice === voice.id ? 'bg-primary-50 text-primary-700' : ''}`}
                  >
                    {voice.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleTTS}
            disabled={ttsLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              ttsPlaying
                ? 'bg-error-100 text-error-700 hover:bg-error-200'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            }`}
            title={ttsPlaying ? 'Stop' : 'Read aloud'}
          >
            {ttsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : ttsPlaying ? (
              <>
                <VolumeX className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                Read Aloud
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        {activeSection === 'objectives' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-500" />
              Learning Objectives
            </h2>
            <ul className="space-y-3">
              {(lesson.objectives || []).map((obj, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeSection === 'simple' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-warning-500" />
              Quick Explanation
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {lesson.simple_explanation || 'This section provides a simple overview. Click "Explain Differently" if you need another perspective.'}
              </p>
            </div>
            <button className="mt-4 btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Explain Differently
            </button>
          </div>
        )}

        {activeSection === 'detailed' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              Detailed Explanation
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              {lesson.detailed_explanation || 'A detailed explanation will help you understand the concepts deeply. Each point builds on the previous one.'}
            </div>
          </div>
        )}

        {activeSection === 'examples' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-500" />
              Real-Life Examples
            </h2>
            <div className="space-y-4">
              {(lesson.examples || []).map((ex, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{ex.title || `Example ${i + 1}`}</h4>
                  <p className="text-gray-600">{ex.content}</p>
                </div>
              ))}
              {(lesson.examples?.length || 0) === 0 && (
                <p className="text-gray-500">Examples help connect abstract concepts to real-world situations.</p>
              )}
            </div>
          </div>
        )}

        {activeSection === 'mistakes' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-error-500" />
              Common Mistakes to Avoid
            </h2>
            <div className="space-y-3">
              {(lesson.common_mistakes || []).map((mistake, i) => (
                <div key={i} className="flex items-start gap-3 bg-error-50 rounded-xl p-3">
                  <AlertTriangle className="w-5 h-5 text-error-500 mt-0.5 flex-shrink-0" />
                  <span className="text-error-700">{mistake}</span>
                </div>
              ))}
              {(lesson.common_mistakes?.length || 0) === 0 && (
                <p className="text-gray-500">Being aware of common mistakes helps you avoid them!</p>
              )}
            </div>
          </div>
        )}

        {activeSection === 'tips' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary-500" />
              Memory Tips
            </h2>
            <div className="space-y-3">
              {(lesson.memory_tips || []).map((tip, i) => (
                <div key={i} className="flex items-start gap-3 bg-primary-50 rounded-xl p-3">
                  <Brain className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span className="text-primary-700">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'practice' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-success-500" />
              Practice Questions
            </h2>
            <div className="space-y-4">
              {(lesson.practice_questions || []).slice(0, 5).map((q, i) => (
                <details key={i} className="group bg-gray-50 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100">
                    <span className="font-medium text-gray-900">{q.question}</span>
                    <ChevronDown className="w-5 h-5 text-gray-400 group-open:hidden" />
                    <ChevronUp className="w-5 h-5 text-gray-400 hidden group-open:block" />
                  </summary>
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <p className="text-success-700 bg-success-50 rounded-lg p-3 mt-2">
                      {q.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>

            <button onClick={generateQuiz} className="btn-primary mt-6 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Test Me
            </button>
          </div>
        )}

        {activeSection === 'summary' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-warning-500" />
              Summary
            </h2>
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6 mb-6">
              <p className="text-gray-700 leading-relaxed">
                {lesson.summary || 'Great job completing this lesson! Practice the concepts to reinforce your learning.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={generateQuiz} className="btn-secondary flex items-center gap-2">
                <Target className="w-4 h-4" />
                Take Quiz
              </button>
              <button onClick={() => setActiveSection('tips')} className="btn-secondary flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Review Flashcards
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const sections: LessonSection[] = ['objectives', 'simple', 'detailed', 'examples', 'mistakes', 'tips', 'practice', 'summary'];
            const currentIndex = sections.indexOf(activeSection);
            if (currentIndex > 0) {
              handleSectionChange(sections[currentIndex - 1]);
            }
          }}
          disabled={activeSection === 'objectives'}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {viewProgress >= totalSections ? (
          <button onClick={handleComplete} className="btn-primary flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Complete Lesson
          </button>
        ) : (
          <button
            onClick={() => {
              const sections: LessonSection[] = ['objectives', 'simple', 'detailed', 'examples', 'mistakes', 'tips', 'practice', 'summary'];
              const currentIndex = sections.indexOf(activeSection);
              if (currentIndex < sections.length - 1) {
                handleSectionChange(sections[currentIndex + 1]);
              }
            }}
            className="btn-primary flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
