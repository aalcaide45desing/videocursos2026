'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  price: string;
  isPublished: boolean;
  checkoutUrl: string | null;
}

export function EditCourseForm({ course }: { course: Course }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description || '',
    price: course.price,
    thumbnailUrl: course.thumbnailUrl || '',
    checkoutUrl: course.checkoutUrl || '',
    isPublished: course.isPublished,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/courses?id=${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Curso guardado con éxito');
        router.refresh();
      } else {
        const error = await res.text();
        toast.error('Error: ' + error);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red al guardar el curso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Editar Curso</h1>
          <p className="text-gray-400">Modifica los detalles de la ficha del curso.</p>
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Título del Curso</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="Descripción detallada del curso..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Precio (€)</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Estado de Publicación</label>
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-800 rounded-xl bg-black hover:bg-gray-800 transition-colors h-[50px]">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-10 h-6 outline-none rounded-full transition-colors ${formData.isPublished ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isPublished ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
              <span className="text-sm font-medium text-gray-300">
                {formData.isPublished ? 'Público (Visible en Catálogo)' : 'Oculto (Borrador)'}
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">URL de Compra (Checkout / Hotmart)</label>
          <input
            type="url"
            value={formData.checkoutUrl}
            onChange={(e) => setFormData({ ...formData, checkoutUrl: e.target.value })}
            className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">URL de la Miniatura (Thumbnail)</label>
          <input
            type="url"
            value={formData.thumbnailUrl}
            onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
            className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="https://..."
          />
          {formData.thumbnailUrl && (
            <div className="mt-4 border border-gray-800 rounded-xl p-2 bg-black inline-block">
              <img src={formData.thumbnailUrl} alt="Thumbnail preview" className="h-32 rounded-lg object-cover" />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
