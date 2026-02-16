
import React, { useState } from 'react';
import { Note, Event } from '../types';
import { supabase } from '../supabase';

interface CalendarViewProps {
  notes: Note[];
  events: Event[];
  onSelectNote: (id: string) => void;
  onCreateEvent: (data: Partial<Event>) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ notes, events, onSelectNote, onCreateEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const title = prompt('Add an event for ' + dateStr);
    if (title) {
        onCreateEvent({ title, event_date: dateStr });
    }
  };

  const deleteEvent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this event?')) {
      await supabase.from('events').delete().eq('id', id);
    }
  };

  const getDayData = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
        notes: notes.filter(n => n.updated_at.startsWith(dateStr)),
        events: events.filter(e => e.event_date === dateStr)
    };
  };

  return (
    <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-gray-50 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-10 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-[#1A1A1A]">{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</h2>
          <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-1">Tap a day to manage your schedule</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 transition-colors border border-gray-50"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg></button>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 transition-colors border border-gray-50"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-3xl overflow-hidden flex-1 border border-gray-100 min-h-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-white p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-[2px] border-b border-gray-100">{d}</div>
        ))}
        {blanks.map(b => <div key={`b-${b}`} className="bg-gray-50/50"></div>)}
        {days.map(d => {
          const { notes: dayNotes, events: dayEvents } = getDayData(d);
          const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();

          return (
            <div key={d} onClick={() => handleDateClick(d)} className="bg-white p-2 min-h-[100px] flex flex-col group cursor-pointer hover:bg-indigo-50/20 transition-colors relative border-r border-b border-gray-100 last:border-r-0 overflow-hidden">
              <span className={`text-[11px] font-black mb-2 w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 group-hover:text-indigo-600'}`}>{d}</span>
              <div className="space-y-1 overflow-y-auto scrollbar-hide flex-1 pb-2">
                {dayNotes.map(n => (
                  <div key={n.id} onClick={(e) => { e.stopPropagation(); onSelectNote(n.id); }} className="text-[9px] bg-indigo-50/50 text-indigo-700 px-2 py-1 rounded-md font-bold truncate hover:bg-indigo-100 transition-colors">📝 {n.title}</div>
                ))}
                {dayEvents.map(e => (
                  <div key={e.id} className="group/event relative text-[9px] bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-bold truncate border border-amber-100">
                    <span>📅 {e.title}</span>
                    <button onClick={(ev) => deleteEvent(ev, e.id)} className="absolute right-1 top-1 text-amber-300 hover:text-red-500 opacity-0 group-hover/event:opacity-100 transition-all bg-white/80 rounded">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
