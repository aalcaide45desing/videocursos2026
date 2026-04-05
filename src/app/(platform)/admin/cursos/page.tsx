import { db } from '@/db';
import { courses } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Video, Plus, Settings2, EyeOff, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getDbUser } from '@/lib/auth';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

export default async function AdminCoursesPage() {
  const user = await currentUser();
  const dbUser = await getDbUser(user!.id);

  const allCourses = await db.query.courses.findMany({
    where: dbUser?.role === 'profesor' ? eq(courses.instructorId, user!.id) : undefined,
    orderBy: [desc(courses.createdAt)],
  });

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Cursos</h1>
          <p className="text-gray-400">Crea, edita o publica el catálogo que verán los usuarios.</p>
        </div>
        
        {/* TODO: Pasar a 'use client' si queremos abrir un modal real o hacer un form simple */}
        <Link href="/admin/cursos/nuevo" className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Crear Nuevo Curso
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {allCourses.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-800 rounded-2xl">
            <Video className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Aún no hay cursos</h3>
            <p className="text-gray-500">Dale a "Crear Nuevo Curso" para empezar a nutrir la plataforma.</p>
          </div>
        ) : (
          allCourses.map((course) => (
            <div key={course.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col group hover:border-purple-500/50 transition-colors">
              <div className="relative aspect-video bg-gray-950 flex items-center justify-center">
                {course.thumbnailUrl ? (
                  <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <Video className="w-10 h-10 text-gray-800" />
                )}
                {!course.isPublished && (
                  <div className="absolute top-3 left-3 bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-md">
                    <EyeOff className="w-3 h-3" />
                    Oculto
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-white mb-2 line-clamp-1">{course.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                  {course.description || 'Sin descripción.'}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-mono text-purple-400 font-bold bg-purple-500/10 px-3 py-1 rounded-lg">
                    {course.price ? `${course.price} €` : 'Gratis'}
                  </span>
                  
                  <div className="flex bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
                    <Link href={`/admin/cursos/${course.id}`} className="px-3 py-2 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors border-r border-gray-800" title="Editar curso">
                      <Settings2 className="w-4 h-4" />
                    </Link>
                    <Link href={`/cursos/${course.id}`} className="px-3 py-2 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors" title="Ver como alumno">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
