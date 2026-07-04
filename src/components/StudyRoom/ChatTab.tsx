import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { RoomMessage, Profile } from '../../lib/supabase';
import { Send } from 'lucide-react';

interface ChatTabProps {
  roomId: string;
  messages: (RoomMessage & { profiles: Profile | null })[];
  user: { id: string };
  profile: Profile | null;
}

export function ChatTab({ roomId, messages, user, profile }: ChatTabProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatMessages = messages.filter(m => m.message_type === 'text' || m.message_type === 'system');

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await supabase.from('room_messages').insert({
        room_id: roomId,
        user_id: user.id,
        content: input.trim(),
        message_type: 'text',
      });
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4 scrollbar-thin">
        {chatMessages.map((message) => {
          const isOwn = message.user_id === user?.id;
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 ${
                message.message_type === 'system'
                  ? 'bg-gray-400'
                  : isOwn
                    ? 'bg-accent-500'
                    : 'bg-gradient-to-br from-primary-400 to-primary-600'
              }`}>
                {message.message_type === 'system'
                  ? '#'
                  : message.profiles?.display_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className={`max-w-xs lg:max-w-md ${isOwn ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  {!isOwn && (
                    <span className="text-sm font-medium text-gray-900">
                      {message.profiles?.display_name || 'Unknown'}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`rounded-2xl px-4 py-2.5 ${
                  message.message_type === 'system'
                    ? 'bg-gray-100 text-gray-600 text-center'
                    : isOwn
                      ? 'bg-primary-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}>
                  {message.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="btn-primary px-6"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
