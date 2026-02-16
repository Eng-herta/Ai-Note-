
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { Note, User, Task, Event } from '../types';
import Sidebar from './Sidebar';
import Editor from './Editor';
import AIPanel from './AIPanel';
import CalendarView from './CalendarView';
import GithubSync from './GithubSync';
import { analyzeNote, generateEmbedding } from '../services/gemini';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'calendar'>('notes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const fetchAll = async () => {
    const { data: nData } = await supabase.from('notes').select('*').eq('guest_id', user.id).order('updated_at', { ascending: false });
    const { data: tData } = await supabase.from('tasks').select('*').eq('guest_id', user.id);
    const { data: eData } = await supabase.from('events').select('*').eq('guest_id', user.id).order('event_date', { ascending: true });
    if (nData) setNotes(nData);
    if (tData) setTasks(tData);
    if (eData) setEvents(eData);
  };

  useEffect(() => {
    fetchAll();

    const channel = supabase.channel('dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  const handleAIAnalysis = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.content.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeNote(note.content);
      const embedding = await generateEmbedding(result.improved_title + " " + result.summary);
      
      await supabase.from('notes').update({
        title: result.improved_title,
        summary: result.summary,
        category: result.category,
        note_type: result.note_type,
        tags: result.tags,
        key_points: result.key_points,
        common_topics: result.common_topics,
        suggested_links: result.suggested_links,
        embedding: embedding,
        updated_at: new Date().toISOString()
      }).eq('id', noteId);

      await supabase.from('tasks').delete().eq('note_id', noteId);
      if (result.action_items.length > 0) {
        await supabase.from('tasks').insert(result.action_items.map(text => ({
          note_id: noteId, guest_id: user.id, task_text: text, completed: false
        })));
      }
      
      if (result.suggested_events.length > 0) {
        await supabase.from('events').insert(result.suggested_events.map(ev => ({
          note_id: noteId, guest_id: user.id, title: ev.title, description: ev.description, event_date: ev.date
        })));
      }
      
      await fetchAll();
    } catch (err) {
      console.error("AI Analysis Failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createNewNote = async () => {
    setSaveStatus('saving');
    const { data, error } = await supabase.from('notes').insert([{ 
      guest_id: user.id, title: 'Untitled Note', content: '', tags: [] 
    }]).select();
    
    if (error) {
      console.error("Note creation error:", error);
      setSaveStatus('idle');
      return;
    }
    
    if (data && data.length > 0) {
      setSelectedNoteId(data[0].id);
      setActiveTab('notes');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      await fetchAll();
    }
  };

  const handleUpdateNote = async (updates: Partial<Note>) => {
    if (!selectedNoteId) return;
    setSaveStatus('saving');
    const { error } = await supabase.from('notes').update(updates).eq('id', selectedNoteId);
    if (!error) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('idle');
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Ma hubtaa inaad tirtirto note-kan?')) return;
    await supabase.from('notes').delete().eq('id', id);
    setSelectedNoteId(null);
    await fetchAll();
  };

  const createEvent = async (eventData: Partial<Event>) => {
    await supabase.from('events').insert([{ ...eventData, guest_id: user.id }]);
    await fetchAll();
  };

  const seedTestData = async () => {
    const { error } = await supabase.from('notes').insert([
      {
        guest_id: user.id,
        title: 'Tijaabo Xog',
        content: 'Kani waa tijaabo lagu hubinayo in xogta lagu qori karo Supabase. Tani waa muhiim.',
        tags: ['test', 'demo'],
        category: 'Development'
      }
    ]);
    if (!error) {
      alert("Xogtii tijaabada ahayd waa lagu daray Supabase!");
      await fetchAll();
    }
  };

  const displayNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(q) || 
      n.content.toLowerCase().includes(q) || 
      (n.summary && n.summary.toLowerCase().includes(q))
    );
  }, [notes, searchQuery]);

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden relative font-sans">
      <Sidebar 
        notes={notes} selectedId={selectedNoteId} onSelect={(id) => { setSelectedNoteId(id); setActiveTab('notes'); setIsSidebarOpen(false); }}
        onCreate={createNewNote} onSeed={seedTestData} onGithub={() => setIsGithubOpen(true)} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} user={user}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-white lg:rounded-l-[40px] shadow-2xl relative overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 bg-white shrink-0 border-b border-gray-50">
          <div className="flex items-center space-x-6">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden w-10 h-10 rounded-full overflow-hidden bg-gray-200">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="Profile" />
             </button>
             <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button onClick={() => setActiveTab('notes')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'notes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Notes</button>
                <button onClick={() => setActiveTab('calendar')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Calendar</button>
             </div>
          </div>

          <div className="flex items-center space-x-4">
            {saveStatus !== 'idle' && (
              <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest transition-all">
                {saveStatus === 'saving' ? (
                  <>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-amber-500">Keydinaya...</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-green-500">Waa la keydiyay</span>
                  </>
                )}
              </div>
            )}
            <button 
              onClick={() => setIsAIPanelOpen(!isAIPanelOpen)} 
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isAIPanelOpen ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-8 pb-32 scrollbar-hide">
          {selectedNote ? (
            <div className="max-w-4xl mx-auto py-8">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setSelectedNoteId(null)} className="flex items-center text-gray-400 hover:text-gray-600 text-sm font-bold">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
                  Dashboard
                </button>
                <button onClick={() => deleteNote(selectedNote.id)} className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center space-x-1 px-3 py-1.5 bg-red-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  <span>Tirtir</span>
                </button>
              </div>
              <Editor 
                note={selectedNote} 
                tasks={tasks.filter(t => t.note_id === selectedNote.id)} 
                onUpdate={handleUpdateNote} 
              />
            </div>
          ) : activeTab === 'calendar' ? (
            <div className="max-w-6xl mx-auto py-8 h-full">
              <CalendarView notes={notes} events={events} onSelectNote={setSelectedNoteId} onCreateEvent={createEvent} />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-8">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-extrabold text-[#1A1A1A]">My Workspace</h2>
                  <p className="text-sm text-gray-400 font-medium mt-1">Waxaad halkan ku qori kartaa xog kasta.</p>
                </div>
                <button onClick={createNewNote} className="hidden lg:flex items-center space-x-2 px-6 py-3 bg-[#1E293B] text-white rounded-2xl font-bold text-sm hover:scale-[1.05] transition-all shadow-xl shadow-gray-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                  <span>Qor Note Cusub</span>
                </button>
              </div>

              {displayNotes.length === 0 ? (
                <div className="text-center py-24 flex flex-col items-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center text-gray-200 mb-8 border border-gray-100">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"/></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Workspace-kaagu waa faaruq</h3>
                  <button onClick={createNewNote} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Bilow Qoraalka</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {displayNotes.map(note => (
                    <div key={note.id} onClick={() => setSelectedNoteId(note.id)} className="bg-white p-7 rounded-[32px] custom-shadow cursor-pointer hover:scale-[1.02] transition-all border border-gray-50 flex flex-col justify-between group h-64 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-bl-full -mr-16 -mt-16 group-hover:bg-indigo-100/30 transition-colors"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-600 text-2xl group-hover:bg-white group-hover:shadow-sm transition-all">
                            {note.note_type === 'Meeting' ? '🤝' : note.note_type === 'Study' ? '📚' : note.note_type === 'Idea' ? '💡' : '📄'}
                          </div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">{note.category || 'Draft'}</span>
                        </div>
                        <h3 className="font-extrabold text-gray-900 text-xl leading-tight mb-2 truncate-2-lines">{note.title || 'Untitled Entry'}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed font-medium">{note.summary || 'Guji si aad u qorto xogtaada...'}</p>
                      </div>
                      <div className="flex items-center justify-between mt-6 relative">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{new Date(note.updated_at).toLocaleDateString()}</p>
                        <div className="flex -space-x-1.5">
                           {note.tags?.slice(0, 3).map((t, idx) => (
                             <div key={idx} className="w-7 h-7 rounded-lg bg-indigo-600 text-white border-2 border-white flex items-center justify-center text-[10px] font-black shadow-sm">#</div>
                           ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedNote && (
          <button 
            onClick={() => handleAIAnalysis(selectedNote.id)}
            disabled={isAnalyzing}
            className="fixed bottom-10 right-10 w-16 h-16 bg-[#1E293B] text-white rounded-[24px] flex items-center justify-center shadow-2xl z-40 transition-all hover:scale-110 active:scale-95 disabled:bg-gray-400 group"
          >
            {isAnalyzing ? (
              <svg className="animate-spin w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-8 h-8 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            )}
          </button>
        )}
      </main>

      {isAIPanelOpen && <AIPanel note={selectedNote} onClose={() => setIsAIPanelOpen(false)} />}
      {isGithubOpen && <GithubSync notes={notes} onClose={() => setIsGithubOpen(false)} />}
    </div>
  );
};

export default Dashboard;
