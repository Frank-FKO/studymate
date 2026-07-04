import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { StudyRoom, Profile, RoomParticipant, Achievement, UserAchievement, LearningMemory, ActivityHistory } from '../lib/supabase';
import {
  GraduationCap, Search, Plus, Users, Clock, Target, TrendingUp,
  ChevronRight, BookOpen, Brain, Trophy, Star, Zap, Crown,
  LayoutDashboard, Settings, LogOut, Bell, MessageSquare, Calendar,
  Award, Flame, BarChart3, User, Home, DoorOpen, Copy, Check,
  Sparkles, Play, Image
} from 'lucide-react';

// Subject images from Pexels
const subjectImages: Record<string, string> = {
  mathematics: 'https://images.pexels.com/photos/6256062/pexels-photo-6256062.jpeg?auto=compress&cs=tinysrgb&w=400',
  physics: 'https://images.pexels.com/photos/2598244/pexels-photo-2598244.jpeg?auto=compress&cs=tinysrgb&w=400',
  chemistry: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=400',
  biology: 'https://images.pexels.com/photos/2087275/pexels-photo-2087275.jpeg?auto=compress&cs=tinysrgb&w=400',
  history: 'https://images.pexels.com/photos/2156108/pexels-photo-2156108.jpeg?auto=compress&cs=tinysrgb&w=400',
  literature: 'https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=400',
  'computer-science': 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400',
  economics: 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&w=400',
  psychology: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400',
  geography: 'https://images.pexels.com/photos/1279813/pexels-photo-1279813.jpeg?auto=compress&cs=tinysrgb&w=400',
};

// Empty state illustrations
const emptyStateImages = {
  rooms: 'https://images.pexels.com/photos/4226765/pexels-photo-4226765.jpeg?auto=compress&cs=tinysrgb&w=400',
  achievements: 'https://images.pexels.com/photos/796602/pexels-photo-796602.jpeg?auto=compress&cs=tinysrgb&w=400',
  learning: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=400',
};

interface RoomWithParticipants extends StudyRoom {
  room_participants: RoomParticipant[];
  profiles: { display_name: string; avatar_url: string | null } | null;
}

interface DashboardProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onSelectRoom: (roomId: string) => void;
  onNavigateToLearn: () => void;
}

export function Dashboard({ onCreateRoom, onJoinRoom, onSelectRoom, onNavigateToLearn }: DashboardProps) {
  const { user, profile, signOut } = useAuth();
  const [myRooms, setMyRooms] = useState<RoomWithParticipants[]>([]);
  const [publicRooms, setPublicRooms] = useState<RoomWithParticipants[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [learningMemory, setLearningMemory] = useState<LearningMemory | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'rooms' | 'achievements' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    try {
      // Use the get_user_rooms function to fetch all rooms user has access to
      const { data: userRooms, error: roomsError } = await supabase
        .rpc('get_user_rooms', { user_uuid: user!.id });

      if (roomsError) {
        console.error('Error fetching user rooms:', roomsError);
      }

      if (userRooms && userRooms.length > 0) {
        // Get participant counts for each room
        const roomIds = userRooms.map((r: { id: string }) => r.id);

        // Fetch host profiles separately
        const hostIds = [...new Set(userRooms.map((r: { host_id: string }) => r.host_id))];
        const { data: hostProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', hostIds);

        const roomsWithProfiles = userRooms.map((room: { id: string; host_id: string }) => ({
          ...room,
          room_participants: [{ count: 1 }],
          profiles: hostProfiles?.find(p => p.id === room.host_id) || null
        }));

        setMyRooms(roomsWithProfiles as unknown as RoomWithParticipants[]);
      }

      // Fetch public rooms (excluding user's own rooms)
      const { data: publicData } = await supabase
        .from('study_rooms')
        .select('id, name, subject, topic, description, room_code, is_public, max_members, goal, host_id, current_activity, total_study_time, focus_sessions, settings, created_at, updated_at')
        .eq('is_public', true)
        .neq('host_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch host profiles for public rooms
      const publicHostIds = [...new Set((publicData || []).map(r => r.host_id))];
      const { data: publicHostProfiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', publicHostIds);

      const publicRoomsWithProfiles = (publicData || []).map(room => ({
        ...room,
        room_participants: [{ count: 1 }],
        profiles: publicHostProfiles?.find(p => p.id === room.host_id) || null
      }));

      setPublicRooms(publicRoomsWithProfiles as unknown as RoomWithParticipants[]);

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user!.id);

      setAchievements(achievementsData || []);

      // Fetch learning memory
      const { data: memoryData } = await supabase
        .from('learning_memory')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (memoryData) setLearningMemory(memoryData);

      // Fetch recent activities
      const { data: activitiesData } = await supabase
        .from('activity_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (activitiesData) setRecentActivities(activitiesData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPublicRooms = publicRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total XP', value: learningMemory?.total_xp || profile?.xp || 0, icon: Zap, color: 'warning' },
    { label: 'Study Hours', value: Math.floor((profile?.total_study_time || 0) / 3600), icon: Clock, color: 'primary' },
    { label: 'Day Streak', value: learningMemory?.current_streak || 0, icon: Flame, color: 'accent' },
    { label: 'Level', value: learningMemory?.current_level || profile?.level || 1, icon: Crown, color: 'success' },
  ];

  const recentActivity = recentActivities.length > 0 ? recentActivities.map(a => ({
    action: a.description || a.activity_type,
    time: formatTimeAgo(new Date(a.created_at)),
    icon: a.activity_type.includes('quiz') ? Brain :
          a.activity_type.includes('lesson') ? BookOpen :
          a.activity_type.includes('achievement') ? Award :
          Clock,
    xp: a.xp_earned
  })) : [
    { action: 'Start learning to track your progress!', time: '', icon: Sparkles, xp: 0 },
  ];

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  const copyRoomCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Coretex AI</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <button
          onClick={() => setActiveTab('home')}
          className={activeTab === 'home' ? 'sidebar-item-active w-full' : 'sidebar-item w-full'}
        >
          <Home className="w-5 h-5" />
          Home
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={activeTab === 'rooms' ? 'sidebar-item-active w-full' : 'sidebar-item w-full'}
        >
          <DoorOpen className="w-5 h-5" />
          Study Rooms
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={activeTab === 'achievements' ? 'sidebar-item-active w-full' : 'sidebar-item w-full'}
        >
          <Trophy className="w-5 h-5" />
          Achievements
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'sidebar-item-active w-full' : 'sidebar-item w-full'}
        >
          <User className="w-5 h-5" />
          Profile
        </button>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
              {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{profile?.display_name}</div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Zap className="w-4 h-4 text-primary-500" />
                Level {profile?.level || 1} • {profile?.xp || 0} XP
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="sidebar-item w-full text-gray-500 hover:text-error-600"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  const HomeTab = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/5420197/pexels-photo-5420197.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Learning"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-transparent" />
        </div>
        <div className="relative z-10 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Welcome back, {profile?.display_name?.split(' ')[0]}!
          </h1>
          <p className="text-white/80 text-lg mb-6 max-w-lg">
            Ready to continue your learning journey? Your personalized study plan awaits.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={onNavigateToLearn} className="bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors flex items-center gap-2 shadow-lg">
              <BookOpen className="w-5 h-5" />
              Start Learning
            </button>
            <button onClick={onCreateRoom} className="bg-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2 backdrop-blur-sm">
              <Plus className="w-5 h-5" />
              Create Room
            </button>
            <button onClick={onJoinRoom} className="bg-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2 backdrop-blur-sm">
              <DoorOpen className="w-5 h-5" />
              Join Room
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              stat.color === 'primary' ? 'bg-primary-100 text-primary-600' :
              stat.color === 'accent' ? 'bg-accent-100 text-accent-600' :
              stat.color === 'success' ? 'bg-emerald-100 text-emerald-600' :
              'bg-amber-100 text-amber-600'
            }`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Daily Goal & Streak */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5 bg-gradient-to-br from-primary-50 to-accent-50 border-primary-100">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-gray-900">Daily Goal</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {Math.floor((learningMemory?.daily_goal || 30) - (learningMemory?.daily_goal || 30) * 0.3)}
            </span>
            <span className="text-gray-500">/ {learningMemory?.daily_goal || 30} min</span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: '30%' }}
            />
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-gray-900">Study Streak</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-orange-600">{learningMemory?.current_streak || 0}</span>
            <span className="text-gray-500">days</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {learningMemory?.current_streak == 0 ? "Start studying today!" : "Keep it going!"}
          </p>
        </div>
      </div>

      {/* My Rooms & Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Your Study Rooms</h2>
            <button onClick={() => setActiveTab('rooms')} className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {myRooms.length === 0 ? (
            <div className="card p-0 overflow-hidden">
              <div className="relative h-48">
                <img
                  src={emptyStateImages.rooms}
                  alt="Study together"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
              </div>
              <div className="relative -mt-16 text-center p-6">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">Start Your Learning Journey</h3>
                <p className="text-sm text-gray-500 mb-4">Create or join a study room to collaborate with others</p>
                <button onClick={onCreateRoom} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Create Your First Room
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myRooms.slice(0, 4).map(room => (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className="card p-0 cursor-pointer hover:border-primary-200 group overflow-hidden"
                >
                  {/* Room image */}
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={subjectImages[room.subject.toLowerCase()] || subjectImages.mathematics}
                      alt={room.subject}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className={`absolute top-3 right-3 badge ${room.is_public ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                      {room.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                      {room.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">{room.subject}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {Array.isArray(room.room_participants) ? room.room_participants.length : room.room_participants}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.floor(room.total_study_time / 60)}m
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <div className="card p-4 space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <activity.icon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 truncate">{activity.action}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-400">{activity.time}</p>
                    {activity.xp > 0 && (
                      <span className="text-xs text-warning-600 font-medium">+{activity.xp} XP</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* XP Progress */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-warning-600" />
              <span className="font-medium text-gray-900">Level Progress</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                style={{ width: `${((learningMemory?.total_xp || profile?.xp || 0) % 1000) / 10}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {1000 - ((learningMemory?.total_xp || profile?.xp || 0) % 1000)} XP to Level {(learningMemory?.current_level || profile?.level || 1) + 1}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const RoomsTab = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Rooms</h1>
          <p className="text-gray-500">Join public rooms or create your own</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onJoinRoom} className="btn-secondary">
            <DoorOpen className="w-5 h-5" />
            Join with Code
          </button>
          <button onClick={onCreateRoom} className="btn-primary">
            <Plus className="w-5 h-5" />
            Create Room
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search rooms by name or subject..."
          className="input-field pl-12"
        />
      </div>

      {/* My Rooms */}
      {myRooms.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Rooms</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRooms.map(room => (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className="card p-5 cursor-pointer hover:border-primary-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${room.host_id === user?.id ? 'badge-warning' : 'badge-primary'}`}>
                      {room.host_id === user?.id ? 'Host' : 'Member'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyRoomCode(room.room_code);
                      }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 bg-gray-100 hover:bg-primary-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      {copiedCode === room.room_code ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          {room.room_code}
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                  {room.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{room.subject} {room.topic && `• ${room.topic}`}</p>
                {room.goal && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Target className="w-3.5 h-3.5" />
                    {room.goal}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {Array.isArray(room.room_participants) ? room.room_participants.length : room.room_participants}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.floor(room.total_study_time / 60)}m
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public Rooms */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Discover Public Rooms</h2>
        {filteredPublicRooms.length === 0 ? (
          <div className="card p-8 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No public rooms found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPublicRooms.map(room => (
              <div
                key={room.id}
                className="card p-0 overflow-hidden hover:border-primary-200 group"
              >
                <div className="relative h-32">
                  <img
                    src={subjectImages[room.subject.toLowerCase()] || subjectImages.mathematics}
                    alt={room.subject}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-3 right-3 badge badge-primary text-xs bg-white/90 backdrop-blur-sm">Public</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{room.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{room.subject}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs text-primary-700 font-medium">
                      {(room.profiles as { display_name: string })?.display_name?.charAt(0) || 'H'}
                    </div>
                    <span className="text-sm text-gray-600">
                      Hosted by {(room.profiles as { display_name: string })?.display_name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {Array.isArray(room.room_participants) ? room.room_participants.length : room.room_participants}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectRoom(room.id)}
                      className="text-primary-600 text-sm font-medium hover:text-primary-700"
                    >
                      View Room
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const AchievementsTab = () => (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
        <p className="text-gray-500">Track your progress and earn badges</p>
      </div>

      {achievements.length === 0 ? (
        <div className="card p-0 overflow-hidden">
          <div className="relative h-56">
            <img
              src={emptyStateImages.achievements}
              alt="Achievements"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
          </div>
          <div className="relative -mt-20 text-center p-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-2">No achievements yet</h3>
            <p className="text-sm text-gray-500 mb-4">Complete lessons and quizzes to earn your first badge</p>
            <button onClick={onNavigateToLearn} className="btn-primary">
              <BookOpen className="w-4 h-4" />
              Start Learning
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(ua => {
            const achievement = ua.achievements as Achievement;
            return (
              <div key={ua.id} className="card p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{achievement?.display_name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{achievement?.description}</p>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-600">+{achievement?.xp_reward} XP</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-200/50 text-xs text-gray-500">
                  Earned {new Date(ua.earned_at).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const ProfileTab = () => (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500">Manage your account settings</p>
      </div>

      <div className="card p-8">
        <div className="flex items-start gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-glow">
            {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{profile?.display_name}</h2>
            <p className="text-gray-500 mb-4">{user?.email}</p>
            <div className="flex flex-wrap gap-3">
              <span className="badge badge-primary flex items-center gap-1 px-3 py-1.5 badge-primary">
                <Crown className="w-3.5 h-3.5" />
                Level {profile?.level || 1}
              </span>
              <span className="badge badge-success flex items-center gap-1 px-3 py-1.5">
                <Zap className="w-3.5 h-3.5" />
                {profile?.xp || 0} XP
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">{Math.floor((profile?.total_study_time || 0) / 3600)}</div>
            <div className="text-sm text-gray-500">Study Hours</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">{profile?.sessions_attended || 0}</div>
            <div className="text-sm text-gray-500">Sessions</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">{profile?.quizzes_completed || 0}</div>
            <div className="text-sm text-gray-500">Quizzes</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">{profile?.achievements_count || 0}</div>
            <div className="text-sm text-gray-500">Badges</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto scrollbar-thin">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'rooms' && <RoomsTab />}
        {activeTab === 'achievements' && <AchievementsTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </main>
    </div>
  );
}
