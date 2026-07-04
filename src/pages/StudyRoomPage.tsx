import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { StudyRoom, RoomParticipant, RoomMessage, Profile } from '../lib/supabase';
import { ChatTab, AITutorTab, WhiteboardTab, NotesTab, QuizTab, AnalyticsTab } from '../components/StudyRoom';
import {
  ArrowLeft, Users, Settings, Copy, Check, Crown, Clock, Target,
  MessageSquare, Brain, FileText, Palette, BarChart3, Play, Pause,
  RotateCcw, LogOut, Mic, MicOff, Video, VideoOff, Hand, Share2,
  ScreenShareOff, X, User
} from 'lucide-react';

interface ParticipantWithProfile extends RoomParticipant {
  profiles: Profile;
}

interface RoomWithParticipants extends StudyRoom {
  room_participants: ParticipantWithProfile[];
}

type RoomTab = 'chat' | 'ai' | 'notes' | 'whiteboard' | 'quiz' | 'analytics';

interface MediaState {
  micEnabled: boolean;
  videoEnabled: boolean;
  handRaised: boolean;
  screenSharing: boolean;
}

interface PeerState {
  userId: string;
  displayName: string;
  micEnabled: boolean;
  videoEnabled: boolean;
  handRaised: boolean;
  stream?: MediaStream;
}

interface StudyRoomPageProps {
  roomId: string;
  onBack: () => void;
}

export function StudyRoomPage({ roomId, onBack }: StudyRoomPageProps) {
  const { user, profile } = useAuth();
  const [room, setRoom] = useState<RoomWithParticipants | null>(null);
  const [messages, setMessages] = useState<(RoomMessage & { profiles: Profile | null })[]>([]);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);
  const [activeTab, setActiveTab] = useState<RoomTab>('chat');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Media state
  const [mediaState, setMediaState] = useState<MediaState>({
    micEnabled: false,
    videoEnabled: false,
    handRaised: false,
    screenSharing: false,
  });

  // WebRTC refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Peer states for other participants
  const [peerStates, setPeerStates] = useState<Map<string, PeerState>>(new Map());

  useEffect(() => {
    fetchRoomData();
    const cleanup = subscribeToUpdates();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cleanup?.();
      stopAllMedia();
    };
  }, [roomId]);

  // Update participant media states when participants change
  useEffect(() => {
    const newPeerStates = new Map<string, PeerState>();
    participants.forEach(p => {
      if (p.user_id !== user?.id) {
        newPeerStates.set(p.user_id, {
          userId: p.user_id,
          displayName: p.profiles.display_name,
          micEnabled: false,
          videoEnabled: false,
          handRaised: false,
        });
      }
    });
    setPeerStates(newPeerStates);
  }, [participants, user?.id]);

  async function fetchRoomData() {
    try {
      const { data: roomData, error: roomError } = await supabase
        .rpc('get_room_for_user', { room_uuid: roomId, user_uuid: user!.id })
        .maybeSingle();

      if (roomError) throw roomError;
      if (!roomData) {
        setLoading(false);
        return;
      }

      const { data: participantsData } = await supabase
        .from('room_participants')
        .select('*, profiles(*)')
        .eq('room_id', roomId);

      const roomWithParticipants = {
        ...roomData,
        room_participants: participantsData || []
      };

      setRoom(roomWithParticipants as unknown as RoomWithParticipants);
      setParticipants(participantsData || []);

      const { data: messagesData } = await supabase
        .from('room_messages')
        .select(`*, profiles(*)`)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching room:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToUpdates() {
    const channel = supabase.channel(`room:${roomId}`);

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as RoomMessage & { profiles: Profile | null }]);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`,
      }, () => {
        fetchRoomData();
      })
      .on('broadcast', { event: 'media_state' }, (payload) => {
        // Handle peer media state changes
        if (payload.payload && payload.payload.userId !== user?.id) {
          setPeerStates(prev => {
            const newStates = new Map(prev);
            const existing = newStates.get(payload.payload.userId);
            if (existing) {
              newStates.set(payload.payload.userId, {
                ...existing,
                ...payload.payload,
              });
            }
            return newStates;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Stop all media streams
  const stopAllMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
  }, []);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    try {
      if (!mediaState.micEnabled && !localStreamRef.current) {
        // Need to get user media first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mediaState.videoEnabled });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }

      if (localStreamRef.current) {
        const audioTracks = localStreamRef.current.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = !mediaState.micEnabled;
        });
      }

      const newMicState = !mediaState.micEnabled;
      setMediaState(prev => ({ ...prev, micEnabled: newMicState }));

      // Broadcast state change
      await supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'media_state',
        payload: {
          userId: user?.id,
          displayName: profile?.display_name,
          micEnabled: newMicState,
          videoEnabled: mediaState.videoEnabled,
          handRaised: mediaState.handRaised,
        },
      });
    } catch (error) {
      console.error('Error toggling mic:', error);
    }
  }, [mediaState, roomId, user?.id, profile?.display_name]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      if (!mediaState.videoEnabled) {
        // Turn on video
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: mediaState.micEnabled,
          video: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } else {
        // Turn off video
        if (localStreamRef.current) {
          const videoTracks = localStreamRef.current.getVideoTracks();
          videoTracks.forEach(track => {
            track.stop();
          });
        }
      }

      const newVideoState = !mediaState.videoEnabled;
      setMediaState(prev => ({ ...prev, videoEnabled: newVideoState }));

      // Broadcast state change
      await supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'media_state',
        payload: {
          userId: user?.id,
          displayName: profile?.display_name,
          micEnabled: mediaState.micEnabled,
          videoEnabled: newVideoState,
          handRaised: mediaState.handRaised,
        },
      });
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  }, [mediaState, roomId, user?.id, profile?.display_name]);

  // Toggle hand raise
  const toggleHand = useCallback(async () => {
    const newHandState = !mediaState.handRaised;
    setMediaState(prev => ({ ...prev, handRaised: newHandState }));

    // Broadcast state change
    await supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'media_state',
      payload: {
        userId: user?.id,
        displayName: profile?.display_name,
        micEnabled: mediaState.micEnabled,
        videoEnabled: mediaState.videoEnabled,
        handRaised: newHandState,
      },
    });

    // Send system message about hand raise
    if (newHandState) {
      await supabase.from('room_messages').insert({
        room_id: roomId,
        user_id: user?.id,
        content: `${profile?.display_name} raised their hand`,
        message_type: 'system',
      });
    }
  }, [mediaState, roomId, user?.id, profile?.display_name]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!mediaState.screenSharing) {
        // Start screen share
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = stream;

        // Listen for when user stops sharing
        stream.getVideoTracks()[0].onended = () => {
          setMediaState(prev => ({ ...prev, screenSharing: false }));
          screenStreamRef.current = null;
        };

        setMediaState(prev => ({ ...prev, screenSharing: true }));

        // Notify others
        await supabase.from('room_messages').insert({
          room_id: roomId,
          user_id: user?.id,
          content: `${profile?.display_name} started screen sharing`,
          message_type: 'system',
        });
      } else {
        // Stop screen share
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
        setMediaState(prev => ({ ...prev, screenSharing: false }));
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      if ((error as Error).name === 'NotAllowedError') {
        // User cancelled screen share
        setMediaState(prev => ({ ...prev, screenSharing: false }));
      }
    }
  }, [mediaState.screenSharing, roomId, user?.id, profile?.display_name]);

  const copyRoomCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.room_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isHost = room?.host_id === user?.id;

  const toggleTimer = () => {
    if (timerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimerMode(m => m === 'focus' ? 'break' : 'focus');
            return timerMode === 'focus' ? 5 * 60 : 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerSeconds(timerMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLeaveRoom = async () => {
    stopAllMedia();
    if (isHost) {
      const otherMembers = participants.filter(p => p.user_id !== user?.id);
      if (otherMembers.length > 0) {
        const newHost = otherMembers[0];
        await supabase.from('study_rooms').update({ host_id: newHost.user_id }).eq('id', roomId);
        await supabase.from('room_participants').update({ role: 'host' }).eq('id', newHost.id);
      } else {
        await supabase.from('study_rooms').delete().eq('id', roomId);
      }
    }
    await supabase.from('room_participants').delete().eq('room_id', roomId).eq('user_id', user!.id);
    onBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Room not found</p>
          <button onClick={onBack} className="btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'ai' as const, icon: Brain, label: 'AI Tutor' },
    { id: 'whiteboard' as const, icon: Palette, label: 'Whiteboard' },
    { id: 'notes' as const, icon: FileText, label: 'Notes' },
    { id: 'quiz' as const, icon: BarChart3, label: 'Quiz' },
    { id: 'analytics' as const, icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">{room.name}</h1>
                <span className={`badge text-xs ${room.is_public ? 'badge-primary' : 'bg-gray-100 text-gray-600'}`}>
                  {room.is_public ? 'Public' : 'Private'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{room.subject}</span>
                {room.topic && <span>- {room.topic}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {room.room_code}
                </>
              )}
            </button>

            <div className="h-6 w-px bg-gray-200" />

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>

            <button
              onClick={handleLeaveRoom}
              className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-500 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-gray-100 flex flex-col">
          {/* Timer */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                Pomodoro Timer
              </h3>
              <span className={`text-xs font-medium ${timerMode === 'focus' ? 'text-primary-600' : 'text-emerald-600'}`}>
                {timerMode === 'focus' ? 'Focus' : 'Break'}
              </span>
            </div>

            <div className="text-center py-4">
              <div className={`text-5xl font-mono font-bold ${timerMode === 'focus' ? 'text-primary-600' : 'text-emerald-600'}`}>
                {formatTime(timerSeconds)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {timerMode === 'focus' ? 'Focus time' : 'Take a break!'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleTimer}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all ${
                  timerRunning
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                }`}
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start
                  </>
                )}
              </button>
              <button
                onClick={resetTimer}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Room Goal */}
          {room.goal && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-primary-500" />
                <span className="text-gray-600">{room.goal}</span>
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="flex-1 overflow-auto scrollbar-thin p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              Members ({participants.length})
            </h3>
            <div className="space-y-2">
              {participants.map((participant) => {
                const isCurrentUser = participant.user_id === user?.id;
                const peerState = peerStates.get(participant.user_id);
                const showMic = isCurrentUser ? mediaState.micEnabled : peerState?.micEnabled;
                const showVideo = isCurrentUser ? mediaState.videoEnabled : peerState?.videoEnabled;
                const showHand = isCurrentUser ? mediaState.handRaised : peerState?.handRaised;

                return (
                  <div
                    key={participant.id}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                      showHand ? 'bg-warning-50 border border-warning-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative">
                      {showVideo && isCurrentUser ? (
                        <video
                          ref={isCurrentUser ? localVideoRef : undefined}
                          autoPlay
                          playsInline
                          muted
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {participant.profiles.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {participant.role === 'host' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {showHand && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-warning-400 rounded-full flex items-center justify-center animate-bounce">
                          <Hand className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm truncate">
                          {participant.profiles.display_name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-xs text-primary-600">(You)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${
                          participant.role === 'host' ? 'text-amber-600' :
                          participant.role === 'co-host' ? 'text-primary-600' : 'text-gray-500'
                        }`}>
                          {participant.role.charAt(0).toUpperCase() + participant.role.slice(1)}
                        </span>
                        <div className="flex items-center gap-1">
                          {showMic ? (
                            <Mic className="w-3 h-3 text-success-500" />
                          ) : (
                            <MicOff className="w-3 h-3 text-gray-400" />
                          )}
                          {showVideo ? (
                            <Video className="w-3 h-3 text-success-500" />
                          ) : (
                            <VideoOff className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.floor(participant.study_time / 60)}m
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice/Video Controls */}
          <div className="p-4 border-t border-gray-100">
            {/* Local Video Preview */}
            {mediaState.videoEnabled && (
              <div className="mb-3 relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-32 rounded-xl object-cover bg-gray-900"
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/50 rounded-lg">
                  {mediaState.micEnabled ? (
                    <Mic className="w-3 h-3 text-white" />
                  ) : (
                    <MicOff className="w-3 h-3 text-red-400" />
                  )}
                  <span className="text-xs text-white">{profile?.display_name}</span>
                </div>
              </div>
            )}

            {/* Screen Share Preview */}
            {mediaState.screenSharing && (
              <div className="mb-3 p-2 bg-primary-50 rounded-xl flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary-600" />
                <span className="text-xs text-primary-700">Screen sharing active</span>
              </div>
            )}

            <div className="flex justify-center gap-2">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-xl transition-colors ${
                  mediaState.micEnabled
                    ? 'bg-success-500 text-white hover:bg-success-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title={mediaState.micEnabled ? 'Turn off microphone' : 'Turn on microphone'}
              >
                {mediaState.micEnabled ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-xl transition-colors ${
                  mediaState.videoEnabled
                    ? 'bg-success-500 text-white hover:bg-success-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title={mediaState.videoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {mediaState.videoEnabled ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={toggleHand}
                className={`p-3 rounded-xl transition-colors ${
                  mediaState.handRaised
                    ? 'bg-warning-500 text-white hover:bg-warning-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title={mediaState.handRaised ? 'Lower hand' : 'Raise hand'}
              >
                <Hand className={`w-5 h-5 ${mediaState.handRaised ? 'animate-bounce' : ''}`} />
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-xl transition-colors ${
                  mediaState.screenSharing
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title={mediaState.screenSharing ? 'Stop screen share' : 'Share screen'}
              >
                {mediaState.screenSharing ? (
                  <ScreenShareOff className="w-5 h-5" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="bg-white border-b border-gray-100 px-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && (
              <ChatTab roomId={roomId} messages={messages} user={user!} profile={profile} />
            )}
            {activeTab === 'ai' && (
              <AITutorTab
                roomId={roomId}
                roomContext={{ subject: room.subject, topic: room.topic }}
                messages={messages}
                user={user!}
                profile={profile}
              />
            )}
            {activeTab === 'whiteboard' && (
              <WhiteboardTab roomId={roomId} user={user!} />
            )}
            {activeTab === 'notes' && (
              <NotesTab roomId={roomId} user={user!} />
            )}
            {activeTab === 'quiz' && (
              <QuizTab roomId={roomId} user={user!} isHost={isHost} />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsTab room={room} participants={participants} />
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Room Settings</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span>Room Code</span>
                <span className="font-mono font-medium">{room.room_code}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span>Created</span>
                <span>{new Date(room.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span>Max Members</span>
                <span>{room.max_members}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span>Total Study Time</span>
                <span>{Math.floor(room.total_study_time / 60)} minutes</span>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="btn-secondary w-full mt-4">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
