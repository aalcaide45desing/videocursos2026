'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import Hls from 'hls.js';
import { Settings } from 'lucide-react';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSyncRef = useRef<number>(initialLastPositionSecs);
  const hlsRef = useRef<Hls | null>(null);

  // Estados para la selección de calidad
  const [levels, setLevels] = useState<{ id: number; height: number; bitrate: number }[]>([]);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(-1); // -1 es Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !videoRef.current) return;

    setError(null);
    const video = videoRef.current;
    const src = `/api/video/manifest?lessonId=${lessonId}`;

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        xhrSetup: (xhr, url) => {
          if (url.includes('/api/video/')) {
            xhr.withCredentials = true;
          }
        },
        manifestLoadingMaxRetry: 3,
        fragLoadingMaxRetry: 3,
        fragLoadingRetryDelay: 1000,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        if (initialLastPositionSecs > 0 && video) {
          video.currentTime = initialLastPositionSecs;
        }
        
        // Guardar las calidades detectadas (ej. 1080, 720, 480)
        const availableLevels = data.levels.map((level, i) => ({
          id: i,
          height: level.height,
          bitrate: level.bitrate,
        })).sort((a, b) => b.height - a.height); // Ordenar de mayor a menor calidad
        
        setLevels(availableLevels);
        setCurrentLevelIndex(hls.currentLevel);
      });

      // Escuchar cuando HLS cambia de nivel automáticamente
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        if (hls.autoLevelEnabled) {
          // Si está en auto, el currentLevelIndex reflejará -1 para la UI
          setCurrentLevelIndex(-1);
        } else {
          setCurrentLevelIndex(data.level);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError(`Error de red al cargar el vídeo: ${data.details}`);
              hls.startLoad(); 
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError(`Error de media: ${data.details}`);
              hls.recoverMediaError();
              break;
            default:
              setError(`Error fatal: ${data.details}`);
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari (iOS) delega la calidad al sistema operativo nativamente
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        if (initialLastPositionSecs > 0) {
          video.currentTime = initialLastPositionSecs;
        }
      });
    } else {
      setError('Tu navegador no soporta reproducción de vídeo HLS.');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [mounted, lessonId, initialLastPositionSecs]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;

    if (onTimeUpdateCallback) {
      onTimeUpdateCallback(currentTime);
    }

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
  }, [lessonId, durationSeconds, onTimeUpdateCallback]);

  const changeLevel = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index; // -1 significa Auto
      setCurrentLevelIndex(index);
      setShowQualityMenu(false);
    }
  };

  if (!mounted) return <div className="aspect-video bg-gray-900 rounded-lg animate-pulse" />;

  const randomPositionCSS = {
    top: `${Math.floor(Math.random() * 80)}%`,
    left: `${Math.floor(Math.random() * 70)}%`,
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-gray-800 shadow-2xl bg-black group">
      {/* Marca de agua anti-piratería */}
      {user?.emailAddresses[0] && (
        <div
          className="pointer-events-none absolute z-40 text-white/5 font-mono text-sm tracking-widest break-all select-none transition-all duration-[60000ms]"
          style={randomPositionCSS}
        >
          {user.emailAddresses[0].emailAddress}
        </div>
      )}

      {/* Menú de Calidad (HLS.js) */}
      {levels.length > 0 && Hls.isSupported() && (
        <div className="absolute top-4 right-4 z-50">
          <div className="relative">
            <button
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Calidad de Vídeo"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {showQualityMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 py-1 overflow-hidden">
                <button
                  onClick={() => changeLevel(-1)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    currentLevelIndex === -1 ? 'bg-purple-600/30 text-purple-400 font-semibold' : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Automático
                </button>
                {levels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => changeLevel(level.id)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      currentLevelIndex === level.id ? 'bg-purple-600/30 text-purple-400 font-semibold' : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {level.height}p
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel de error visible */}
      {error && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
          <div className="text-red-400 text-4xl mb-3">⚠️</div>
          <p className="text-red-300 font-semibold text-sm mb-1">Error al cargar el vídeo</p>
          <p className="text-gray-500 text-xs font-mono max-w-sm">{error}</p>
          <button
            onClick={() => { setError(null); hlsRef.current?.startLoad(); }}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Reproductor nativo HTML5 + hls.js */}
      <video
        ref={videoRef}
        controls
        playsInline
        crossOrigin="anonymous"
        poster={thumbnailUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full aspect-video outline-none"
        style={{ backgroundColor: 'black' }}
      >
        {langSubtitles?.es && (
          <track src={langSubtitles.es} kind="subtitles" label="Español" srcLang="es" default />
        )}
        {langSubtitles?.en && (
          <track src={langSubtitles.en} kind="subtitles" label="Inglés" srcLang="en" />
        )}
      </video>
    </div>
  );
}
