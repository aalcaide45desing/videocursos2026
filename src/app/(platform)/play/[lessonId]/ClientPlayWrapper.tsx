'use client';

import { useState } from 'react';
import { LessonPlayer } from '@/components/video/LessonPlayer';
import { NotesSidebar } from '@/components/video/NotesSidebar';
import { X, Pencil, Loader2 } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { toast } from 'sonner';

interface ClientPlayWrapperProps {
  lessonId: string;
  initialTimeSecs: number;
  durationSeconds: number | null;
}

export function ClientPlayWrapper({ lessonId, initialTimeSecs, durationSeconds }: ClientPlayWrapperProps) {
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(initialTimeSecs);
  const [forceSeekTime, setForceSeekTime] = useState<number>(initialTimeSecs);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTime, setModalTime] = useState(0);
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Refetch trigger para que el sidebar se actualice
  const [refreshNotesKey, setRefreshNotesKey] = useState(0);

  const handleAddNoteRequest = (time: number) => {
    setModalTime(time);
    setNoteContent('');
    setIsModalOpen(true);
  };

  const saveModalNote = async () => {
    if (!noteContent.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          content: noteContent.trim(),
          timestampSeconds: Math.floor(modalTime),
        }),
      });

      if (res.ok) {
        toast.success(`Nota guardada en ${formatDuration(Math.floor(modalTime))}`);
        setIsModalOpen(false);
        setRefreshNotesKey(prev => prev + 1);
      } else {
        toast.error('Error al guardar la nota');
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-6 relative">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Reproductor de Vídeo */}
        <div className="w-full lg:w-3/4">
          <LessonPlayer 
            lessonId={lessonId}
            initialLastPositionSecs={forceSeekTime} 
            durationSeconds={durationSeconds}
            onTimeUpdateCallback={(time) => setCurrentVideoTime(time)}
            onAddNoteRequest={handleAddNoteRequest}
          >
            {/* Modal Emergente de Notas de Vídeo (Ahora dentro del reproductor para verse en FullScreen) */}
            {isModalOpen && (
              <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Pencil className="w-5 h-5 text-purple-400" />
                      <h3 className="text-xl font-bold text-white">
                        Tomar Nota en <span className="text-purple-400 font-mono bg-purple-900/30 px-2 py-0.5 rounded ml-1">{formatDuration(Math.floor(modalTime))}</span>
                      </h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white" disabled={isSaving}>
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <textarea
                    autoFocus
                    rows={4}
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="¿Qué quieres recordar de este momento exacto?"
                    className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 mb-6 resize-none"
                    disabled={isSaving}
                  />

                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setIsModalOpen(false)} 
                      className="px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                      disabled={isSaving}
                    >
                      Descartar
                    </button>
                    <button 
                      onClick={saveModalNote}
                      disabled={!noteContent.trim() || isSaving}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Nota'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </LessonPlayer>
        </div>

        {/* Barra Lateral Interactiva Notas Privadas */}
        <div className="w-full lg:w-1/4 h-[500px] lg:h-auto">
          {/* Le pasamos refreshNotesKey para que su useEffect dependa de él y recargue */}
          <NotesSidebar 
            key={`sidebar-${refreshNotesKey}`} // Forzamos remount si es lo más fácil, o podemos pasar flag
            lessonId={lessonId}
            currentTime={currentVideoTime}
            onSeekTo={(seconds) => setForceSeekTime(seconds)}
          />
        </div>

      </div>
    </div>
  );
}
