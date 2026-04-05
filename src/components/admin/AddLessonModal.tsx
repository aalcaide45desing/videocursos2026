'use client';

import { useState } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface AddLessonModalProps {
  courseId: string;
  nextOrder: number; // para saber el número de lección que toca
  onClose: () => void;
  onAdded: (lesson: any) => void;
}

export function AddLessonModal({ courseId, nextOrder, onClose, onAdded }: AddLessonModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    megaS4MasterPath: '',
    durationSeconds: '',
    isFree: false,
  });

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title: form.title,
          megaS4MasterPath: form.megaS4MasterPath,
          durationSeconds: form.durationSeconds ? parseInt(form.durationSeconds) : null,
          isFree: form.isFree,
          order: nextOrder,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText);
        toast.error('Error: ' + errorText);
        return;
      }
      const lesson = await res.json();
      toast.success('Lección añadida correctamente');
      onAdded(lesson);
      onClose();
    } catch {
      setError('Error de red, inténtalo de nuevo.');
      toast.error('Error de red, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Nueva Lección #{nextOrder + 1}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Título <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Introducción a la interfaz de Blender"
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-sm"
            />
          </div>

          {/* Path MEGA S4 */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Ruta del vídeo en MEGA S4 (master.m3u8)
            </label>
            <input
              type="text"
              value={form.megaS4MasterPath}
              onChange={(e) => set('megaS4MasterPath', e.target.value)}
              placeholder="blender-principiantes/leccion-01/master.m3u8"
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ruta relativa dentro de tu bucket de MEGA S4. El script encode_course.sh la genera automáticamente.
            </p>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Duración (segundos)</label>
            <input
              type="number"
              min="0"
              value={form.durationSeconds}
              onChange={(e) => set('durationSeconds', e.target.value)}
              placeholder="Ej: 600 = 10 minutos"
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-sm"
            />
          </div>

          {/* Es gratuita */}
          <button
            type="button"
            onClick={() => set('isFree', !form.isFree)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
              form.isFree
                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                : 'bg-gray-950 border-gray-700 text-gray-400'
            }`}
          >
            {form.isFree ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {form.isFree ? 'Demo gratuita (visible públicamente)' : 'Solo para alumnos con acceso'}
          </button>

          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Añadir Lección'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors rounded-xl text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
