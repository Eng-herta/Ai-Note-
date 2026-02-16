
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate or retrieve a persistent anonymous ID for the user
    let guestId = localStorage.getItem('ai_note_guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('ai_note_guest_id', guestId);
    }
    
    setUser({ 
      id: guestId, 
      email: 'Guest User' 
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Initialising Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {user && <Dashboard user={user} />}
    </div>
  );
};

export default App;
