import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

export default async function AdminEditCoursePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [course] = await db.select().from(courses).where(eq(courses.id, params.id));
  
  if (!course) notFound();

  return (
    <div className="p-8 max-w-4xl min-h-screen">
      <Link href="/admin/cursos" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver a cursos
      </Link>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Editar Curso</h1>
          <p className="text-gray-400">Modifica los detalles de la ficha del curso.</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors">
          <Save className="w-4 h-4" /> Guardar Cambios
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="text-gray-400 text-center py-12 border-2 border-dashed border-gray-800 rounded-xl">
          <p>⚠️ El panel completo de edición está en construcción.</p>
          <p className="text-sm mt-2">Pronto podrás editar: {course.title}</p>
        </div>
      </div>
    </div>
  );
}
