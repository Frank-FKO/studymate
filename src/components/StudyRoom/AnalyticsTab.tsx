import { StudyRoom } from '../../lib/supabase';
import { Clock, Target, Users, MessageSquare, TrendingUp, Award, Trophy } from 'lucide-react';

interface ParticipantWithProfile {
  user_id: string;
  study_time: number;
  messages_count: number;
  profiles: { display_name: string } | null;
}

interface AnalyticsTabProps {
  room: StudyRoom;
  participants: ParticipantWithProfile[];
}

export function AnalyticsTab({ room, participants }: AnalyticsTabProps) {
  const stats = [
    {
      label: 'Total Study Time',
      value: `${Math.floor(room.total_study_time / 3600)}h ${Math.floor((room.total_study_time % 3600) / 60)}m`,
      icon: Clock,
      color: 'primary',
    },
    {
      label: 'Focus Sessions',
      value: room.focus_sessions,
      icon: Target,
      color: 'accent',
    },
    {
      label: 'Active Members',
      value: participants.length,
      icon: Users,
      color: 'success',
    },
    {
      label: 'Messages Exchanged',
      value: participants.reduce((sum, p) => sum + p.messages_count, 0),
      icon: MessageSquare,
      color: 'warning',
    },
  ];

  const maxStudyTime = Math.max(...participants.map(p => p.study_time || 1));

  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Room Analytics</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Member Participation
            </h3>
            <div className="space-y-3">
              {participants.map((p) => (
                <div key={p.user_id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium text-sm">
                    {p.profiles?.display_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {p.profiles?.display_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.floor(p.study_time / 60)}m
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                        style={{ width: `${Math.min(100, (p.study_time / maxStudyTime) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Achievements Unlocked
            </h3>
            <div className="space-y-3">
              {['Team Player', 'Focus Champion', 'Quiz Genius'].map((achievement, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{achievement}</div>
                    <div className="text-xs text-gray-500">Unlocked by room</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
