import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { RoomMessage, Profile } from '../../lib/supabase';
import { Send, Wifi, WifiOff } from 'lucide-react';

interface ChatTabProps {
  roomId: string;
  messages: (RoomMessage & { profiles: Profile | null })[];
  user: { id: string };
  profile: Profile | null;
}

export function ChatTab({ roomId, messages, user, profile }: ChatTabProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track realtime connection status
  useEffect(() => {
    const channel = supabase.channel(`chat-status:${roomId}`);

    channel
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const chatMessages = messages.filter(m => m.message_type === 'text' || m.message_type === 'system');

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const messageContent = input.trim();
    setSending(true);
    setInput('');

    try {
      const { error } = await supabase.from('room_messages').insert({
        room_id: roomId,
        user_id: user.id,
        content: messageContent,
        message_type: 'text',
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      setInput(messageContent); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Connection status indicator */}
      <div className={`flex items-center gap-2 px-4 py-2 text-xs ${
        isConnected ? 'text-success-600 bg-success-50' : 'text-warning-600 bg-warning-50'
      }`}>
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Reconnecting...</span>
          </>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          chatMessages.map((message) => {
            const isOwn = message.user_id === user?.id;
            const isSystem = message.message_type === 'system';

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 ${
                    isSystem
                      ? 'bg-gray-400'
                      : isOwn
                        ? 'bg-accent-500'
                        : 'bg-gradient-to-br from-primary-400 to-primary-600'
                  }`}
                >
                  {isSystem
                    ? '#'
                    : message.profiles?.display_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isOwn && !isSystem && (
                      <span className="text-sm font-medium text-gray-900">
                        {message.profiles?.display_name || 'Unknown'}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      isSystem
                        ? 'bg-gray-100 text-gray-600 text-center w-full max-w-none'
                        : isOwn
                          ? 'bg-primary-500 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
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
            disabled={sending || !isConnected}
          />
          <button
            type="submit"
            disabled={sending || !input.trim() || !isConnected}
            className="btn-primary px-6 disabled:opacity-50"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
