import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LearningProvider } from './contexts/LearningContext';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { StudyRoomPage } from './pages/StudyRoomPage';
import { LearnPage } from './pages/LearnPage';
import { CreateRoomModal, JoinRoomModal } from './components/RoomModals';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'room' | 'learn'>('dashboard');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const params = new URLSearchParams(window.location.search);
      const roomCode = params.get('room');
      if (roomCode) {
        handleJoinRoom(roomCode);
      }
    }
  }, [user, loading]);

  const handleCreateRoom = () => setShowCreateModal(true);
  const handleJoinRoom = () => setShowJoinModal(true);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setActiveView('room');
  };

  const handleRoomCreated = (roomId: string) => {
    setSelectedRoomId(roomId);
    setActiveView('room');
  };

  const handleRoomJoined = (roomId: string) => {
    setSelectedRoomId(roomId);
    setActiveView('room');
  };

  const handleBackToDashboard = () => {
    setActiveView('dashboard');
    setSelectedRoomId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-xl">C</span>
          </div>
          <p className="text-gray-500">Loading Cortex AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      {activeView === 'dashboard' && (
        <Dashboard
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onSelectRoom={handleSelectRoom}
          onNavigateToLearn={() => setActiveView('learn')}
        />
      )}

      {activeView === 'learn' && (
        <LearnPage onBack={handleBackToDashboard} />
      )}

      {activeView === 'room' && selectedRoomId && (
        <StudyRoomPage
          roomId={selectedRoomId}
          onBack={handleBackToDashboard}
        />
      )}

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleRoomCreated}
      />

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoined={handleRoomJoined}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <LearningProvider>
        <AppContent />
      </LearningProvider>
    </AuthProvider>
  );
}

export default App;
