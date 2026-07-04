import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, Sparkles } from 'lucide-react';

interface QuizTabProps {
  roomId: string;
  user: { id: string };
  isHost: boolean;
}

export function QuizTab({ roomId, user, isHost }: QuizTabProps) {
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [creating, setCreating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);

  const createQuiz = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert({
          room_id: roomId,
          created_by: user.id,
          subject: subject,
          difficulty,
          question_count: questionCount,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      const questions = [];
      for (let i = 0; i < questionCount; i++) {
        questions.push({
          quiz_session_id: data.id,
          question_text: `Sample Question ${i + 1}: What is the correct answer?`,
          correct_answer: 'A',
          explanation: 'This is the explanation for this question.',
          question_type: 'written',
          points: 1,
          order_index: i,
        });
      }

      await supabase.from('quiz_questions').insert(questions);
      setActiveQuiz(data);
      setShowCreateQuiz(false);
    } catch (error) {
      console.error('Error creating quiz:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white p-6">
      {!activeQuiz ? (
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Collaborative Quiz</h2>
            <p className="text-gray-500">Challenge your study group with AI-generated questions</p>
          </div>

          {isHost ? (
            <>
              {!showCreateQuiz ? (
                <button
                  onClick={() => setShowCreateQuiz(true)}
                  className="btn-primary w-full py-4 text-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  Create New Quiz
                </button>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Calculus"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <div className="flex gap-3">
                      {(['easy', 'medium', 'hard'] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                            difficulty === d
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Questions: {questionCount}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowCreateQuiz(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createQuiz}
                      disabled={creating || !subject}
                      className="btn-primary flex-1"
                    >
                      {creating ? (
                        <Sparkles className="w-5 h-5 animate-spin" />
                      ) : (
                        'Create Quiz'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500">
              <p>Waiting for the host to start a quiz...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quiz Active!</h2>
          <p className="text-gray-500">Quiz ID: {activeQuiz.id}</p>
        </div>
      )}
    </div>
  );
}
