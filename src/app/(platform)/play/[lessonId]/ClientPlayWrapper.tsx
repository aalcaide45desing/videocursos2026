'use client';

import { useState } from 'react';
import { LessonPlayer } from '@/components/video/LessonPlayer';
import { NotesSidebar } from '@/components/video/NotesSidebar';

interface ClientPlayWrapperProps {
  lessonId: string;
  initialTimeSecs: number;
  durationSeconds: number | null;
}

export function ClientPlayWrapper({ lessonId, initialTimeSecs, durationSeconds }: ClientPlayWrapperProps) {
  // Estado para compartir el contador de tiempo entre el vídeo y las notas en vivo
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(initialTimeSecs);
  
  // Estado para forzar saltos de tiempo cuando pulsen en una nota
  const [forceSeekTime, setForceSeekTime] = useState<number>(initialTimeSecs);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-6">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Reproductor de Vídeo (75% ancho en desktop) */}
        <div className="w-full lg:w-3/4">
          <LessonPlayer 
            lessonId={lessonId}
            initialLastPositionSecs={forceSeekTime} 
            durationSeconds={durationSeconds}
            onTimeUpdateCallback={(time) => setCurrentVideoTime(time)}
          />
        </div>

        {/* Barra Lateral Interactiva Notas Privadas (25% ancho) */}
        <div className="w-full lg:w-1/4 h-[500px] lg:h-auto">
          <NotesSidebar 
            lessonId={lessonId}
            currentTime={currentVideoTime}
            onSeekTo={(seconds) => setForceSeekTime(seconds)}
          />
        </div>

      </div>
    </div>
  );
}
