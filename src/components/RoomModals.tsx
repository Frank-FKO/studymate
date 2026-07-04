import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
  X, BookOpen, Target, Users, Lock, Globe, Sparkles,
  Plus, DoorOpen, Copy, Check, AlertCircle
} from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (roomId: string) => void;
}

export function CreateRoomModal({ isOpen, onClose, onCreated }: CreateRoomModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxMembers, setMaxMembers] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: room, error: roomError } = await supabase
        .from('study_rooms')
        .insert({
          name: name.trim(),
          subject: subject.trim(),
          topic: topic.trim() || null,
          description: description.trim() || null,
          goal: goal.trim() || null,
          is_public: isPublic,
          max_members: maxMembers,
          host_id: user!.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add host as participant
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: room.id,
          user_id: user!.id,
          role: 'host',
        });

      if (participantError) throw participantError;

      // Create shared notes
      await supabase
        .from('shared_notes')
        .insert({
          room_id: room.id,
          content: { blocks: [] },
        });

      onCreated(room.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History',
    'Literature', 'Computer Science', 'Economics', 'Psychology', 'Other'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm onClick={onClose}" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-auto animate-scale-in">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Study Room</h2>
            <p className="text-sm text-gray-500">Set up your collaborative learning space</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-error-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Name <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Calculus Study Group"
                className="input-field"
                required
                maxLength={50}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-error-500">*</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Derivatives"
                  className="input-field"
                  maxLength={30}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will you be studying?"
                className="input-field resize-none"
                rows={3}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary-500" />
                  Room Goal
                </div>
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Complete 3 chapters, Score 90% on quiz"
                className="input-field"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isPublic ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      !isPublic ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    Private
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-500" />
                    Max Members
                  </div>
                </label>
                <select
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                  className="input-field"
                >
                  {[5, 10, 15, 20, 30, 50].map(n => (
                    <option key={n} value={n}>{n} members</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name || !subject} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Room
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (roomId: string) => void;
}

export function JoinRoomModal({ isOpen, onClose, onJoined }: JoinRoomModalProps) {
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<{
    id: string;
    name: string;
    subject: string;
    host_name: string;
    member_count: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleLookup = async () => {
    setError(null);
    setRoomInfo(null);
    setLoading(true);

    try {
      const { data: room, error: roomError } = await supabase
        .from('study_rooms')
        .select('id, name, subject, host_id, room_participants(count)')
        .eq('room_code', roomCode.toUpperCase())
        .maybeSingle();

      if (roomError) throw roomError;

      if (!room) {
        setError('Room not found. Check the code and try again.');
        return;
      }

      // Fetch host profile
      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', room.host_id)
        .maybeSingle();

      // Check if already a member
      const { data: existing } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        onJoined(room.id);
        onClose();
        return;
      }

      setRoomInfo({
        id: room.id,
        name: room.name,
        subject: room.subject,
        host_name: hostProfile?.display_name || 'Unknown',
        member_count: Array.isArray(room.room_participants)
          ? room.room_participants.length
          : (room.room_participants as { count: number }).count || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!roomInfo) return;

    setLoading(true);
    setError(null);

    try {
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: roomInfo.id,
          user_id: user!.id,
          role: 'member',
        });

      if (participantError) {
        if (participantError.message.includes('duplicate')) {
          onJoined(roomInfo.id);
          onClose();
          return;
        }
        throw participantError;
      }

      onJoined(roomInfo.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm click={onClose}" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Join Study Room</h2>
            <p className="text-sm text-gray-500">Enter the room code to join</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-error-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {!roomInfo ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  className="input-field text-center text-lg tracking-widest font-mono uppercase"
                  maxLength={8}
                />
              </div>

              <button
                onClick={handleLookup}
                disabled={loading || roomCode.length !== 8}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Searching...
                  </span>
                ) : (
                  <>
                    <DoorOpen className="w-5 h-5" />
                    Find Room
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="card p-5 bg-gradient-to-br from-primary-50 to-accent-50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{roomInfo.name}</h3>
                    <p className="text-sm text-gray-600">{roomInfo.subject}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {roomInfo.member_count} members
                      </span>
                      <span>Hosted by {roomInfo.host_name}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRoomInfo(null);
                    setError(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    <>
                      <DoorOpen className="w-5 h-5" />
                      Join Room
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
