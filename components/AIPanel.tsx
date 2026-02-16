
import React, { useState, useRef, useEffect } from 'react';
import { Note, ChatMessage } from '../types';
import { chatWithNote } from '../services/gemini';

interface AIPanelProps {
  note: Note | undefined;
  onClose: () => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ note, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !note || isLoading) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);
    
    try {
      const response = await chatWithNote(note.content, messages, userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 lg:w-96 bg-white border-l border-gray-100 flex flex-col h-full shadow-2xl z-20 transition-all">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">AI Insights</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
        {/* Prominent Intelligence Section */}
        {note && (note.common_topics || note.suggested_links) && (
          <div className="px-6 py-6 space-y-8 bg-gradient-to-b from-[#F8FAFC] to-white border-b border-gray-50">
            
            {/* Common Topics Cloud - Made Prominent */}
            {note.common_topics && note.common_topics.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Topic Cloud</h4>
                  <span className="w-8 h-1 bg-indigo-100 rounded-full"></span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {note.common_topics.map((topic, i) => (
                    <span 
                      key={topic} 
                      className={`px-4 py-2 rounded-2xl text-[12px] font-bold shadow-sm border border-gray-50 transition-transform hover:scale-105 cursor-default
                        ${i % 3 === 0 ? 'bg-white text-indigo-600' : i % 3 === 1 ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-900 text-white'}
                      `}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Connections */}
            {note.suggested_links && note.suggested_links.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Recommended Links</h4>
                <div className="space-y-3">
                  {note.suggested_links.map(link => (
                    <div 
                      key={link} 
                      className="group flex items-center justify-between p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                        </div>
                        <span className="text-[12px] font-bold text-gray-700 truncate">{link}</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat History Section */}
        <div ref={scrollRef} className="flex-1 p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-2">Ready to assist</p>
              <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
                I've processed your note. Ask me to summarize, find specific details, or expand on your ideas.
              </p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-4 rounded-3xl text-[13px] leading-relaxed shadow-sm transition-all
                ${m.role === 'user' 
                  ? 'bg-gray-900 text-white rounded-tr-none' 
                  : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gemini is thinking</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleChat} className="p-5 border-t border-gray-100 bg-white shrink-0 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.02)]">
        <div className="relative group">
          <input 
            type="text" 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            placeholder="Ask anything about this note..." 
            className="w-full bg-gray-50 border border-transparent rounded-2xl py-3.5 pl-5 pr-14 text-sm font-medium focus:ring-4 focus:ring-indigo-50 focus:bg-white focus:border-indigo-100 transition-all outline-none placeholder-gray-400" 
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading} 
            className="absolute right-2 top-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:bg-gray-200 disabled:shadow-none shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
          </button>
        </div>
        <p className="mt-3 text-[10px] text-center text-gray-400 font-medium tracking-tight">
          Gemini 3 Pro enabled with Reasoning Engine
        </p>
      </form>
    </div>
  );
};

export default AIPanel;
