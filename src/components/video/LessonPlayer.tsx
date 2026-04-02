'use client';

import { useEffect, useRef, useState } from 'react';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider, Poster, type MediaPlayerInstance, Track } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { useUser } from '@clerk/nextjs';

interface LessonPlayerProps {
  lessonId: string;
  initialLastPositionSecs?: number;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  onTimeUpdateCallback?: (currentTime: number) => void;
  langSubtitles?: { es?: string; en?: string };
}

export function LessonPlayer({
  lessonId,
  initialLastPositionSecs = 0,
  durationSeconds,
  thumbnailUrl,
  langSubtitles,
  onTimeUpdateCallback,
}: LessonPlayerProps) {
  const { user } = useUser();
  const playerRef = useRef<MediaPlayerInstance>(null);
  const [mounted, setMounted] = useState(false);
  const lastSyncRef = useRef<number>(initialLastPositionSecs);

  useEffect(() => {
    setMounted(true);
    // Establecer currentTime inicial tras montar si es necesario
    if (initialLastPositionSecs > 0 && playerRef.current) {
      playerRef.current.currentTime = initialLastPositionSecs;
    }
  }, [initialLastPositionSecs]);

  const handleTimeUpdate = (detail: any) => {
    // Vidstack puede pasar un número directamente o { currentTime: number } dependiendo del evento
    const currentTime = typeof detail === 'number' ? detail : detail?.currentTime ?? 0;

    // Si queremos habilitar "Notas al minuto", propagamos el tiempo actual hacia arriba
    if (onTimeUpdateCallback) {
      onTimeUpdateCallback(currentTime);
    }

    // Sincronizar progreso a Neon cada 15 segundos reales
    if (Math.abs(currentTime - lastSyncRef.current) > 15) {
      lastSyncRef.current = currentTime;
      fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          lastPositionSeconds: Math.floor(currentTime),
          completed: durationSeconds ? currentTime >= durationSeconds * 0.9 : false,
        }),
      }).catch(console.error);
    }
  };

  if (!mounted) return <div className="aspect-video bg-gray-900 rounded-lg animate-pulse" />;

  // Generamos una animación aleatoria para el watermark
  const randomPositionCSS = {
    top: `${Math.floor(Math.random() * 80)}%`,
    left: `${Math.floor(Math.random() * 70)}%`,
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-gray-800 shadow-2xl bg-black">
      {/* 
        Watermark de seguridad anti-piratería
        Muestra sutilmente el email en posiciones aleatorias para desanimar la grabación de pantalla.
        Solo al 5% de opacidad para que no moleste al aprendizaje real pero salte a la vista si se comparte robado.
      */}
      {user?.emailAddresses[0] && (
        <div
          className="pointer-events-none absolute z-50 text-white/5 font-mono text-sm tracking-widest break-all select-none transition-all duration-[60000ms]"
          style={randomPositionCSS}
        >
          {user.emailAddresses[0].emailAddress}
        </div>
      )}

      {/* 
        Vidstack Player 
        Carga el máster HLS desde nuestro Proxy seguro, nunca del CDN directo
      */}
      <MediaPlayer
        ref={playerRef}
        title="Reproductor Seguro"
        src={`/api/video/manifest?lessonId=${lessonId}`}
        crossOrigin
        playsInline
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full aspect-video"
      >
        <MediaProvider>
          {thumbnailUrl && <Poster src={thumbnailUrl} className="vds-poster flex items-center justify-center bg-black/50" />}
          
          {langSubtitles?.es && (
            <Track
              src={langSubtitles.es}
              kind="subtitles"
              label="Español"
              lang="es-LA"
              default
            />
          )}
          {langSubtitles?.en && (
            <Track
              src={langSubtitles.en}
              kind="subtitles"
              label="Inglés"
              lang="en-US"
            />
          )}
        </MediaProvider>

        <DefaultVideoLayout
          thumbnails={thumbnailUrl || undefined}
          icons={defaultLayoutIcons}
          color="hsl(var(--primary))"
        />
      </MediaPlayer>
    </div>
  );
}
