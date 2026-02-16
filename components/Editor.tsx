
import React, { useState, useEffect, useRef } from 'react';
import { Note, Task, NoteImage } from '../types';
import { supabase } from '../supabase';

interface EditorProps {
  note: Note;
  tasks: Task[];
  onUpdate: (updates: Partial<Note>) => void;
}

const Editor: React.FC<EditorProps> = ({ note, tasks, onUpdate }) => {
  const [content, setContent] = useState(note.content);
  const [title, setTitle] = useState(note.title);
  const [images, setImages] = useState<NoteImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(note.content);
    setTitle(note.title);
    fetchImages();
  }, [note.id]);

  const fetchImages = async () => {
    const { data } = await supabase.from('images').select('*').eq('note_id', note.id);
    if (data) setImages(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileName = `${note.guest_id}/${note.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('note-images').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('note-images').getPublicUrl(fileName);
      await supabase.from('images').insert({ 
        note_id: note.id, 
        guest_id: note.guest_id, 
        image_url: publicUrl 
      });
      fetchImages();
    } catch (err) {
      alert('Upload failed. Ensure the "note-images" bucket exists and is public.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm('Remove this attachment?')) return;
    await supabase.from('images').delete().eq('id', id);
    fetchImages();
  };

  const handleAutoSave = (field: 'content' | 'title', val: string) => {
    if (field === 'content') setContent(val);
    else setTitle(val);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
        onUpdate({ [field]: val, updated_at: new Date().toISOString() });
    }, 1000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div className="flex-1 flex items-center space-x-6">
          <div className="w-16 h-16 rounded-[24px] bg-gray-50 flex items-center justify-center text-3xl shadow-sm border border-gray-100 shrink-0">
            {note.note_type === 'Meeting' ? '🤝' : note.note_type === 'Study' ? '📚' : note.note_type === 'Idea' ? '💡' : '📄'}
          </div>
          <div className="flex-1">
            <input 
              className="text-3xl font-black text-[#1A1A1A] w-full border-none focus:ring-0 p-0 placeholder-gray-200 transition-all bg-transparent"
              value={title}
              onChange={(e) => handleAutoSave('title', e.target.value)}
              placeholder="Note Title..."
            />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              {note.updated_at ? `Last sync ${new Date(note.updated_at).toLocaleTimeString()}` : 'New Note'}
            </p>
          </div>
        </div>
        
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-50 text-gray-700 font-bold text-sm rounded-2xl hover:bg-gray-100 transition-all border border-gray-100 group shadow-sm"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
          )}
          <span>Attach</span>
        </button>
      </div>

      <section className="bg-white rounded-[40px] p-10 custom-shadow border border-gray-50 relative group/editor">
        {images.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide">
            {images.map(img => (
              <div key={img.id} className="relative shrink-0 w-64 h-40 rounded-3xl overflow-hidden border-2 border-gray-50 shadow-sm group/img transition-all hover:border-indigo-100">
                <img src={img.image_url} alt="Attached" className="w-full h-full object-cover" />
                <button 
                  onClick={() => deleteImage(img.id)} 
                  className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea 
          value={content}
          onChange={(e) => handleAutoSave('content', e.target.value)}
          placeholder="What's on your mind? Capture every thought..."
          className="w-full min-h-[500px] text-xl text-gray-800 border-none focus:ring-0 resize-none leading-relaxed bg-transparent placeholder-gray-200 font-medium"
        />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
        <div className="bg-white p-8 rounded-[32px] custom-shadow border border-gray-50 transition-all hover:border-indigo-50">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[2px] mb-6 flex items-center justify-between">
            <span>Action Items</span>
            <span className="w-10 h-0.5 bg-gray-100 rounded-full"></span>
          </h3>
          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map(task => (
                <label key={task.id} className="flex items-center space-x-4 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={task.completed} 
                    onChange={async () => await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id)}
                    className="w-6 h-6 border-2 border-gray-200 rounded-lg text-indigo-600 focus:ring-0 transition-all cursor-pointer"
                  />
                  <span className={`text-sm font-bold transition-all ${task.completed ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                    {task.task_text}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-300 font-bold italic">No tasks identified yet. Run AI Analysis to extract tasks.</p>
          )}
        </div>

        <div className="bg-white p-8 rounded-[32px] custom-shadow border border-gray-50 transition-all hover:border-indigo-50">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[2px] mb-6 flex items-center justify-between">
            <span>Key Points</span>
            <span className="w-10 h-0.5 bg-gray-100 rounded-full"></span>
          </h3>
          {note.key_points && note.key_points.length > 0 ? (
            <ul className="space-y-4">
              {note.key_points.map((pt, i) => (
                <li key={i} className="flex items-start space-x-3 text-sm text-gray-600 font-bold leading-snug">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0 shadow-sm shadow-indigo-200"></span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-300 font-bold italic">AI will summarize key takeaways here after analysis.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
