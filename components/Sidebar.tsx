
import React from 'react';
import { Note, User } from '../types';

interface SidebarProps {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onSeed: () => void;
  onGithub: () => void;
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  notes, selectedId, onSelect, onCreate, onSeed, onGithub, isOpen, onClose, searchQuery, setSearchQuery, user 
}) => {
  const categories = Array.from(new Set(notes.map(n => n.category || 'General')));

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/10 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside className={`fixed inset-y-0 left-0 z-[60] w-80 bg-white shadow-2xl transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:z-10 lg:shadow-none lg:bg-[#F8F9FA]`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-[#1E293B] rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200 transform rotate-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-[#1E293B]">Ai Note</span>
          </div>

          <div className="relative mb-10 group">
            <input 
              type="text" 
              placeholder="Raadi xogtaada..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-white border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 custom-shadow transition-all group-hover:shadow-md" 
            />
            <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5"></path></svg>
          </div>

          <div className="flex-1 overflow-y-auto space-y-8 scrollbar-hide">
            {notes.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 leading-loose">Ma jirto xog weli</p>
                <button onClick={onSeed} className="text-[10px] font-black text-indigo-500 hover:underline uppercase tracking-widest">Kudar xog tijaabo ah</button>
              </div>
            ) : (
              categories.map(cat => (
                <div key={cat}>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[2px] mb-4 flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                    {cat}
                  </h3>
                  <div className="space-y-3">
                    {notes.filter(n => (n.category || 'General') === cat).slice(0, 8).map(note => (
                      <button 
                        key={note.id} 
                        onClick={() => onSelect(note.id)} 
                        className={`w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden ${selectedId === note.id ? 'bg-[#1E293B] text-white shadow-xl shadow-gray-200' : 'text-gray-500 hover:bg-white hover:text-[#1E293B] hover:shadow-sm border border-transparent'}`}
                      >
                        <span className="text-sm font-bold truncate block relative z-10">{note.title || 'Untitled'}</span>
                        <p className={`text-[11px] mt-1 opacity-60 truncate font-medium relative z-10 ${selectedId === note.id ? 'text-gray-200' : 'text-gray-400'}`}>
                          {note.summary || 'Click to edit...'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-8 border-t border-gray-100 flex items-center justify-between">
             <div className="flex items-center space-x-3 truncate">
               <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0 border border-white">
                 {user.id.slice(-2).toUpperCase()}
               </div>
               <div className="truncate">
                 <p className="text-xs font-black text-[#1E293B] truncate uppercase tracking-wide">ID: {user.id.slice(0, 8)}</p>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Guest Account</p>
               </div>
             </div>
             <div className="flex space-x-2">
                <button onClick={onGithub} className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-black hover:bg-gray-50 transition-all custom-shadow" title="Sync to GitHub">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                </button>
                <button onClick={onCreate} className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-[#1E293B] transition-all custom-shadow">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                </button>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
