'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Pencil, Settings } from 'lucide-react';
import { toast } from 'sonner';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { 
  MediaPlayer, 
  MediaProvider, 
  Track, 
  MediaPlayerInstance,
  Menu,
  usePlaybackRateOptions,
  useVideoQualityOptions,
  Tooltip
} from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';

// Componente para el menú de velocidad custom
function SpeedSelector() {
  const options = usePlaybackRateOptions();
  const hint = options.selectedValue === '1' ? 'x1.0' : `x${options.selectedValue}`;

  return (
    <Menu.Root>
      <Menu.Button 
        disabled={options.disabled} 
        aria-label="Velocidad" 
        className="vds-button flex items-center justify-center px-3 py-1 mx-2 text-sm font-semibold hover:bg-white/20 rounded transition-colors text-white"
      >
        {hint}
      </Menu.Button>
      
      <Menu.Content className="vds-menu-items bg-black/95 backdrop-blur-md border border-gray-800 rounded-lg shadow-xl p-2 min-w-[120px] mb-2 transform -translate-y-2 !bottom-full" placement="top">
        <Menu.RadioGroup value={options.selectedValue}>
          {[0.5, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0].map((rate) => {
            const valStr = rate.toString();
            return (
              <Menu.Radio 
                value={valStr} 
                onSelect={() => {
                  const optArray = Array.from(options as any);
                  const opt = optArray.find((o: any) => o.value === valStr) as any;
                  if (opt) opt.select();
                }} 
                key={valStr}
                className={`flex items-center px-3 py-1.5 rounded cursor-pointer hover:bg-purple-600/50 transition-colors text-sm ${options.selectedValue === valStr ? 'bg-purple-600 text-white font-bold' : '!text-white opacity-80'}`}
              >
                <div className="flex-1">{rate.toFixed(2)}x</div>
                {options.selectedValue === valStr && <span className="text-white text-xs">✓</span>}
              </Menu.Radio>
            );
          })}
        </Menu.RadioGroup>
      </Menu.Content>
    </Menu.Root>
  );
}

// Componente para la Calidad Exclusiva
function QualitySelector() {
  const options = useVideoQualityOptions({ auto: true, sort: 'descending' });
  const hint = options.selectedValue !== 'auto' && options.selectedQuality?.height 
    ? `${options.selectedQuality.height}p` 
    : 'Auto';

  return (
    <Menu.Root>
      <Menu.Button className="vds-button flex items-center justify-center p-2 rounded-md hover:bg-white/20 transition-colors mx-1 text-white" aria-label="Calidad">
        <Settings className="w-[1.25rem] h-[1.25rem] drop-shadow-md" />
      </Menu.Button>
      <Menu.Content className="vds-menu-items bg-black/95 backdrop-blur-md border border-gray-800 rounded-lg shadow-xl p-2 min-w-[120px] mb-2 transform -translate-y-2 !bottom-full" placement="top">
        <Menu.RadioGroup value={options.selectedValue}>
          {Array.from(options as any).map((item: any) => {
            const displayLabel = item.label === 'Auto' ? 'Automático' : item.label;
            return (
              <Menu.Radio 
                value={item.value} 
                onSelect={item.select} 
                key={item.value}
                className={`flex items-center px-3 py-1.5 rounded cursor-pointer hover:bg-purple-600/50 transition-colors text-sm ${options.selectedValue === item.value ? 'bg-purple-600 text-white font-bold' : '!text-white opacity-80'}`}
              >
                <div className="flex-1">{displayLabel}</div>
                {options.selectedValue === item.value && <span className="text-white text-xs">✓</span>}
              </Menu.Radio>
            );
          })}
        </Menu.RadioGroup>
      </Menu.Content>
    </Menu.Root>
  );
}

interface LessonPlayerProps {
  lessonId: string;
  initialLastPositionSecs?: number;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  onTimeUpdateCallback?: (currentTime: number) => void;
  langSubtitles?: { es?: string; en?: string };
  onAddNoteRequest?: (currentTime: number) => void;
  children?: React.ReactNode;
}

export function LessonPlayer({
  lessonId,
  initialLastPositionSecs = 0,
  durationSeconds,
  thumbnailUrl,
  langSubtitles,
  onTimeUpdateCallback,
  onAddNoteRequest,
  children,
}: LessonPlayerProps) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const playerRef = useRef<MediaPlayerInstance>(null);
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTimeUpdate = (time: number) => {
    if (onTimeUpdateCallback) onTimeUpdateCallback(time);

    if (Math.abs(time - lastSyncRef.current) > 15) {
      lastSyncRef.current = time;
      fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          lastPositionSeconds: Math.floor(time),
          completed: durationSeconds ? time >= durationSeconds * 0.9 : false,
        }),
      }).catch(console.error);
    }
  };

  useEffect(() => {
    if (initialLastPositionSecs > 0 && playerRef.current) {
      playerRef.current.currentTime = initialLastPositionSecs;
    }
  }, [initialLastPositionSecs]);

  const handleFloatingNoteClick = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (playerRef.current) {
      playerRef.current.pause();
      if (onAddNoteRequest) onAddNoteRequest(playerRef.current.currentTime);
      else toast.info('Añadiendo nota...');
    }
  };

  if (!mounted) return <div className="aspect-video bg-gray-900 rounded-lg animate-pulse" />;

  const randomPositionCSS = {
    top: `${Math.floor(Math.random() * 80)}%`,
    left: `${Math.floor(Math.random() * 70)}%`,
  };

  const src = `/api/video/manifest?lessonId=${lessonId}`;

  const PencilButton = () => (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={handleFloatingNoteClick}
      onClick={handleFloatingNoteClick}
      className="vds-button flex items-center justify-center p-2 rounded-md hover:bg-white/20 transition-colors mx-1"
      aria-label="Tomar Nota"
      title="Añadir nota en este segundo"
    >
      <Pencil className="w-[1.125rem] h-[1.125rem] text-purple-400 drop-shadow-md hover:scale-110 transition-transform" />
    </button>
  );

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-gray-800 shadow-2xl bg-black group font-sans custom-player-wrapper">
      <MediaPlayer
        ref={playerRef}
        title=""
        src={src}
        crossOrigin
        playsInline
        poster={thumbnailUrl || undefined}
        onTimeUpdate={(e) => handleTimeUpdate(e.currentTime)}
        className="w-full h-full aspect-video outline-none"
      >
        <MediaProvider>
          {langSubtitles?.es && <Track src={langSubtitles.es} kind="subtitles" label="Español" lang="es" default />}
          {langSubtitles?.en && <Track src={langSubtitles.en} kind="subtitles" label="Inglés" lang="en" />}
        </MediaProvider>

        {user?.emailAddresses[0] && (
          <div
            className="pointer-events-none absolute z-[60] text-white/5 font-mono text-sm tracking-widest break-all select-none transition-all duration-[60000ms]"
            style={randomPositionCSS}
          >
            {user.emailAddresses[0].emailAddress}
          </div>
        )}

        <DefaultVideoLayout 
          icons={defaultLayoutIcons} 
          slots={{
            afterTitle: <SpeedSelector />,
            beforeSettingsMenu: <PencilButton />,
            beforeFullscreenButton: <QualitySelector />
          }}
        />

        {/* Instanciamos hijos (como el Modal de notas) DENTRO del player para soportar Pantalla Completa */}
        {children}
      </MediaPlayer>
      
      {/* Eliminamos el SettingsMenu por defecto. Usaremos nuestro QualitySelector.
          También ocultamos botones de PIP y Google Cast como se requirió. */}
      <style dangerouslySetInnerHTML={{__html: `
        button[aria-label="Settings"],
        button[aria-label="Configuración"],
        button[aria-label*="Picture-in-Picture"],
        button[aria-label*="PiP"],
        button[aria-label*="Google Cast"],
        button[aria-label*="AirPlay"],
        .vds-pip-button,
        .vds-google-cast-button,
        .vds-airplay-button {
           display: none !important;
        }
      `}} />
    </div>
  );
}
