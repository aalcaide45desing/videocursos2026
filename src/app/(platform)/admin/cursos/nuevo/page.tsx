'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Globe, EyeOff } from 'lucide-react';

export default function NuevoCursoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    thumbnailUrl: '',
    checkoutUrl: '',
    isPublished: false,
  });

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: form.price ? parseFloat(form.price) : 0,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || 'Error desconocido');
        return;
      }

      const course = await res.json();
      router.push(`/admin/cursos`);
      router.refresh();
    } catch (err) {
      setError('Error de red, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Nuevo Curso</h1>
          <p className="text-gray-400 text-sm">Rellena los datos básicos para publicarlo después.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Título del curso <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Ej: Blender para Principiantes 2026"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Descripción</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe brevemente el curso y qué aprenderá el alumno..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Precio */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Precio (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0 = Gratis"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Estado publicación */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Visibilidad</label>
            <button
              type="button"
              onClick={() => set('isPublished', !form.isPublished)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all border ${
                form.isPublished
                  ? 'bg-green-500/10 border-green-500/40 text-green-400'
                  : 'bg-gray-900 border-gray-700 text-gray-400'
              }`}
            >
              {form.isPublished ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {form.isPublished ? 'Publicado' : 'Oculto (Borrador)'}
            </button>
          </div>
        </div>

        {/* URL Miniatura */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">URL de miniatura (portada)</label>
          <input
            type="url"
            value={form.thumbnailUrl}
            onChange={(e) => set('thumbnailUrl', e.target.value)}
            placeholder="https://... (imagen alojada en MEGA S4)"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* URL Checkout Hotmart */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Link de compra (Hotmart)
          </label>
          <input
            type="url"
            value={form.checkoutUrl}
            onChange={(e) => set('checkoutUrl', e.target.value)}
            placeholder="https://pay.hotmart.com/..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-2">
            Cuando se ponga un link aquí, el botón de compra en la web pública te llevará directo a Hotmart.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Curso'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors rounded-xl"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
