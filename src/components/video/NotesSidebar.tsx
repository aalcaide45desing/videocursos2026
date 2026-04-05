'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Clock, Trash2, Pencil, Check, X } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { toast } from 'sonner';

interface NoteType {
  id: string;
  content: string;
  timestampSeconds: number;
}

interface NotesSidebarProps {
  lessonId: string;
  currentTime: number; // Viene del onTimeUpdateCallback del LessonPlayer
  onSeekTo: (seconds: number) => void; // Función para decirle al payer que salte de tiempo
}

export function NotesSidebar({ lessonId, currentTime, onSeekTo }: NotesSidebarProps) {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/notes?lessonId=${lessonId}`);
      if (res.ok) setNotes(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [lessonId]);

  const handleSaveNote = async () => {
    if (!newNoteContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          content: newNoteContent.trim(),
          timestampSeconds: Math.floor(currentTime),
        }),
      });

      if (res.ok) {
        const addedNote = await res.json();
        const updatedNotes = [...notes, addedNote].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
        setNotes(updatedNotes);
        setNewNoteContent('');
        setIsAdding(false);
        toast.success('Nota guardada');
      }
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!confirm('¿Borrar esta nota?')) return;

    try {
      const res = await fetch(`/api/notes?id=${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes(notes.filter((n) => n.id !== noteId));
        toast.success('Nota eliminada');
      }
    } catch (error) {
      toast.error('Error al borrar');
    }
  };

  const handleUpdateNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!editContent.trim()) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, content: editContent.trim() })
      });
      if (res.ok) {
        setNotes(notes.map(n => n.id === noteId ? { ...n, content: editContent.trim() } : n));
        setEditingNoteId(null);
        toast.success('Nota actualizada');
      }
    } catch (err) {
      toast.error('Error al actualizar');
    }
  };

  return (
    <div className="w-full h-full bg-black/40 border border-gray-800 rounded-xl flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-200">Mis Notas</h3>
        </div>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
          {notes.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {notes.length === 0 && !isAdding && (
          <div className="text-center text-gray-500 text-sm py-8 mt-10">
            Aún no tienes notas. Dale al botón de abajo para apuntar algo en el {formatDuration(Math.floor(currentTime))}.
          </div>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => { if (editingNoteId !== note.id) onSeekTo(note.timestampSeconds); }}
            className={`group p-3 rounded-lg border transition-all ${editingNoteId === note.id ? 'bg-gray-900 border-purple-500' : 'bg-gray-900/80 border-gray-800 hover:border-purple-500/50 cursor-pointer'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                {formatDuration(note.timestampSeconds)}
              </span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                {editingNoteId !== note.id && (
                  <button onClick={(e) => { e.stopPropagation(); setEditingNoteId(note.id); setEditContent(note.content); }} className="text-gray-500 hover:text-blue-400">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button onClick={(e) => handleDelete(e, note.id)} className="text-gray-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {editingNoteId === note.id ? (
              <div className="mt-2" onClick={e => e.stopPropagation()}>
                <textarea 
                  className="w-full text-sm bg-black border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-purple-500"
                  value={editContent} onChange={e=>setEditContent(e.target.value)} rows={3} autoFocus
                />
                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditingNoteId(null); }} className="text-xs text-gray-400 hover:text-white px-2"><X className="w-4 h-4"/></button>
                  <button onClick={(e) => handleUpdateNote(e, note.id)} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded flex items-center gap-1"><Check className="w-3 h-3"/> Guardar</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-300 line-clamp-3 group-hover:line-clamp-none transition-all">
                {note.content}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        {isAdding ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-xs text-purple-400 font-mono">
              Apuntando en {formatDuration(Math.floor(currentTime))}
            </div>
            <textarea
              autoFocus
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm text-gray-200 outline-none focus:border-purple-500 resize-none h-24"
              placeholder="Escribe tu nota aquí..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNote}
                disabled={!newNoteContent.trim() || isSubmitting}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-sm py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            Añadir nota al {formatDuration(Math.floor(currentTime))}
          </button>
        )}
      </div>
    </div>
  );
}
