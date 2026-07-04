import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RoomMessage, Profile } from '../../lib/supabase';
import { Brain, Send, Sparkles, BookOpen, Lightbulb, Target, RotateCcw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AITutorTabProps {
  roomId: string;
  roomContext?: { subject: string; topic?: string | null };
  messages: (RoomMessage & { profiles: Profile | null })[];
  user: { id: string };
  profile: Profile | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AITutorTab({ roomId, roomContext, messages, user, profile }: AITutorTabProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [suggestionQuestions, setSuggestionQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Generate contextual suggestions based on subject
  useEffect(() => {
    if (roomContext?.subject) {
      const suggestions = generateSuggestions(roomContext.subject, roomContext.topic);
      setSuggestionQuestions(suggestions);
    }
  }, [roomContext]);

  function generateSuggestions(subject: string, topic?: string | null): string[] {
    if (topic) {
      return [
        `Explain ${topic} in simple terms`,
        `What are the key concepts of ${topic}?`,
        `Give me practice problems for ${topic}`,
        `What are common mistakes when learning ${topic}?`,
      ];
    }
    return [
      `What should I learn first in ${subject}?`,
      `Explain a fundamental concept in ${subject}`,
      `What are the best study strategies for ${subject}?`,
      `Quiz me on ${subject} basics`,
    ];
  }

  const sendAIMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuestion = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to chat
    const newUserMessage: ChatMessage = { role: 'user', content: userQuestion };
    setChatHistory(prev => [...prev, newUserMessage]);

    try {
      // Call the AI tutor edge function with user context
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: [...chatHistory, newUserMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          context: roomContext ? `Subject: ${roomContext.subject}${roomContext.topic ? `, Topic: ${roomContext.topic}` : ''}` : undefined,
          userId: user.id,
          supabaseUrl,
          supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const assistantMessage = data.message;

      // Add assistant message to chat
      setChatHistory(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

      // Store AI conversation in database
      await supabase.from('ai_conversations').upsert({
        user_id: user.id,
        conversation_type: 'tutor',
        messages: [...chatHistory, newUserMessage, { role: 'assistant', content: assistantMessage }].map(m => ({
          ...m,
          timestamp: new Date().toISOString()
        })),
        context: roomContext || {},
      }, { onConflict: 'user_id' });

    } catch (error) {
      console.error('Error:', error);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-primary-50/30 to-white">
      <div className="flex-1 overflow-auto p-4 space-y-4 scrollbar-thin">
        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Tutor</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              I remember your learning history and adapt to your level. Ask me anything!
            </p>
            {roomContext && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-sm text-primary-700 mb-6">
                <Target className="w-4 h-4" />
                Ready to help with {roomContext.subject}
                {roomContext.topic && ` - ${roomContext.topic}`}
              </div>
            )}

            {/* Suggestion chips */}
            {suggestionQuestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Try asking:</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                  {suggestionQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(q)}
                      className="px-3 py-1.5 bg-white rounded-full text-sm text-gray-700 border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              message.role === 'assistant'
                ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                : 'bg-accent-500'
            }`}>
              {message.role === 'assistant'
                ? <Brain className="w-5 h-5 text-white" />
                : <span className="text-white font-medium">{profile?.display_name?.charAt(0) || 'U'}</span>}
            </div>
            <div className={`max-w-xl ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {message.role === 'assistant' ? 'Cortex AI' : 'You'}
                </span>
                {message.role === 'assistant' && <Sparkles className="w-3 h-3 text-primary-400" />}
              </div>
              <div className={`rounded-2xl px-4 py-3 ${
                message.role === 'assistant'
                  ? 'bg-white shadow-sm border border-gray-100'
                  : 'bg-primary-500 text-white'
              }`}>
                <div className="whitespace-pre-wrap text-left prose prose-sm max-w-none">
                  {formatMessage(message.content)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {chatHistory.length > 0 && (
        <div className="px-4 pb-2 flex gap-2">
          <button
            onClick={clearChat}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            New Chat
          </button>
          <button
            onClick={() => setInput("Generate a quiz on this topic")}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Target className="w-4 h-4" />
            Quiz Me
          </button>
          <button
            onClick={() => setInput("Create flashcards for this topic")}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            Flashcards
          </button>
        </div>
      )}

      <form onSubmit={sendAIMessage} className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary px-6"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

// Format message with basic markdown support
function formatMessage(content: string): React.ReactNode {
  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const codeContent = part.replace(/```\w*\n?/g, '').replace(/```$/g, '');
      return (
        <pre key={index} className="bg-gray-100 rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono">
          <code>{codeContent}</code>
        </pre>
      );
    }

    // Process inline formatting
    return (
      <span key={index}>
        {part.split('\n').map((line, lineIndex) => {
          // Headers
          if (line.startsWith('## ')) {
            return <h3 key={lineIndex} className="font-bold text-lg mt-3 mb-1">{line.slice(3)}</h3>;
          }
          if (line.startsWith('### ')) {
            return <h4 key={lineIndex} className="font-semibold mt-2 mb-1">{line.slice(4)}</h4>;
          }

          // Bold
          let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

          // Bullet points
          if (line.startsWith('- ')) {
            return (
              <div key={lineIndex} className="flex gap-2 mb-1">
                <span className="text-primary-500">•</span>
                <span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
              </div>
            );
          }

          // Numbered lists
          if (/^\d+\. /.test(line)) {
            const [num, ...rest] = line.split('. ');
            return (
              <div key={lineIndex} className="flex gap-2 mb-1">
                <span className="text-primary-500 font-medium">{num}.</span>
                <span dangerouslySetInnerHTML={{ __html: rest.join('. ') }} />
              </div>
            );
          }

          // Regular text
          if (line.trim()) {
            return (
              <p key={lineIndex} className="mb-1" dangerouslySetInnerHTML={{ __html: processed }} />
            );
          }

          return <br key={lineIndex} />;
        })}
      </span>
    );
  });
}
