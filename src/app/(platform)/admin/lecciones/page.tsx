import { db } from '@/db';
import { courses, lessons } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { ListVideo, GripVertical, Settings2, Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminLessonsPage({ searchParams }: { searchParams: { courseId?: string } }) {
  // Sacar todos los cursos para el selector
  const allCourses = await db.query.courses.findMany();

  // Si no hay courseId en la URL pero hay cursos, redirigimos al primero por defecto
  if (!searchParams.courseId && allCourses.length > 0) {
    redirect(`/admin/lecciones?courseId=${allCourses[0].id}`);
  }

  const activeCourseId = searchParams.courseId;
  let activeLessons: any[] = [];
  
  if (activeCourseId) {
    activeLessons = await db.query.lessons.findMany({
      where: eq(lessons.courseId, activeCourseId),
      orderBy: [asc(lessons.orderIndex)],
    });
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Temario y Lecciones</h1>
          <p className="text-gray-400">Organiza el temario de tus cursos. Arrastra para reordenar.</p>
        </div>
        
        {activeCourseId && (
          <button className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors">
            <Plus className="w-5 h-5" />
            Nueva Lección
          </button>
        )}
      </div>

      {allCourses.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-gray-800 rounded-2xl">
           <ListVideo className="w-12 h-12 text-gray-700 mx-auto mb-4" />
           <p className="text-gray-500">Primero debes crear un curso en la pestaña "Cursos" para poder añadirle lecciones.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Selector de Cursos Lateral */}
          <div className="w-full lg:w-1/4 bg-gray-900 border border-gray-800 rounded-2xl p-4 h-fit">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Selecciona un Curso</h3>
            <div className="space-y-1">
              {allCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/admin/lecciones?courseId=${course.id}`}
                  className={`block px-4 py-3 rounded-lg transition-colors font-medium ${
                    activeCourseId === course.id 
                      ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  {course.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Lista de lecciones del curso seleccionado */}
          <div className="w-full lg:w-3/4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                <span className="font-semibold text-gray-300">Playlist del Curso</span>
                <span className="text-sm font-mono text-gray-500">{activeLessons.length} vídeos</span>
              </div>
              
              <div className="p-4 space-y-2">
                {activeLessons.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    Este curso aún está vacío. ¡Añade tu primera lección (HLS M3U8)!
                  </div>
                ) : (
                  activeLessons.map((lesson, idx) => (
                    <div 
                      key={lesson.id} 
                      className="group flex items-center justify-between p-3 border border-gray-800 bg-gray-900/50 rounded-xl hover:border-purple-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* El grip para arrastrar visualmente en un entorno Full Client. Ahora mismo visual */}
                        <div className="cursor-grab text-gray-600 group-hover:text-gray-400 transition-colors">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <span className="w-6 text-center font-mono text-sm text-gray-500 font-bold">{idx + 1}</span>
                        <div>
                          <h4 className="font-semibold text-gray-200">{lesson.title}</h4>
                          <span className="text-xs text-green-400 font-mono tracking-widest mt-1 inline-block bg-green-400/10 px-2 py-0.5 rounded">
                            {lesson.megaS4MasterPath ? '✔ VÍDEO ENLAZADO' : 'PENDIENTE SUBIR MASTER'}
                          </span>
                        </div>
                      </div>
                      
                      <button className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                        <Settings2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
