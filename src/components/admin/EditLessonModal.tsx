'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  megaS4MasterPath: string;
  durationSeconds: number | null;
  isFree: boolean;
  order: number;
}

interface EditLessonModalProps {
  lesson: Lesson;
  onClose: () => void;
  onUpdated: (lesson: Lesson) => void;
}

export function EditLessonModal({ lesson, onClose, onUpdated }: EditLessonModalProps) {
  const [formData, setFormData] = useState({
    title: lesson.title,
    megaS4MasterPath: lesson.megaS4MasterPath || '',
    isFree: lesson.isFree,
    durationSeconds: lesson.durationSeconds || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/lessons?id=${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          megaS4MasterPath: formData.megaS4MasterPath,
          isFree: formData.isFree,
          durationSeconds: formData.durationSeconds ? parseInt(formData.durationSeconds.toString(), 10) : null,
        }),
      });

      if (res.ok) {
        const updatedLesson = await res.json();
        onUpdated(updatedLesson);
        onClose();
      } else {
        const err = await res.text();
        alert('Error: ' + err);
      }
    } catch (error) {
      console.error(error);
      alert('Error en el servidor. Verifica la consola.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Editar Lección</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Título de la Lección</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Ruta en MEGA S4
            </label>
            <input
              type="text"
              placeholder="Ej: curso-fotografia/leccion-1/master.m3u8"
              value={formData.megaS4MasterPath}
              onChange={(e) => setFormData({ ...formData, megaS4MasterPath: e.target.value })}
              className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
            />
            <p className="text-xs text-blue-400 mt-2 font-mono break-all bg-blue-900/10 p-2 rounded-lg border border-blue-900/30">
              Ruta actual: <br/>{formData.megaS4MasterPath || 'Ninguna'}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">Duración (Segundos)</label>
              <input
                type="number"
                placeholder="600"
                value={formData.durationSeconds}
                onChange={(e) => setFormData({ ...formData, durationSeconds: e.target.value })}
                className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="flex-1 flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-800 rounded-xl bg-black hover:bg-gray-800 transition-colors">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 outline-none rounded-full transition-colors ${formData.isFree ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isFree ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-sm font-medium text-gray-300">¿Gratis?</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-medium py-4 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Guardando...' : <><Check className="w-5 h-5"/> Guardar Cambios</>}
          </button>
        </form>
      </div>
    </div>
  );
}
