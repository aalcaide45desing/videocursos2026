import { db } from '@/db';
import { userCourseAccess } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAdmin } from '@/lib/auth';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle, Library } from 'lucide-react';

export const metadata = {
  title: 'Mi Panel de Alumno | Videocursos 2026',
};

export default async function StudentDashboardPage() {
  const { userId } = await requireAuth();
  const isUserAdmin = await isAdmin();

  // Buscar todos los accesos a cursos de este usuario con la info del curso cargada
  const myAccesses = await db.query.userCourseAccess.findMany({
    where: eq(userCourseAccess.userId, userId),
    with: {
      course: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-100 pb-24">
      {/* Header del Dashboard */}
      <header className="border-b border-gray-900 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Library className="w-6 h-6 text-purple-400" />
             <span className="font-bold text-lg text-white">Mi Academia</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/cursos" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Explorar más cursos
            </Link>
            <div className="pl-6 border-l border-gray-800">
              <UserButton appearance={{ elements: { avatarBox: "w-10 h-10 border-2 border-gray-800" } }} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-16">
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Mis Cursos Comprados</h1>
          <p className="text-gray-400 text-lg">Retoma tu aprendizaje por donde lo dejaste.</p>
        </div>

        {myAccesses.length === 0 ? (
          isUserAdmin ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-16 text-center">
              <Library className="w-16 h-16 text-amber-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">Panel de Creador</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                Eres un administrador de la academia. Visita el Panel de Administración para crear, editar y gestionar los cursos y lecciones.
              </p>
              <Link href="/admin" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg inline-flex items-center gap-2">
                Abrir Admin Panel
              </Link>
            </div>
          ) : (
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-16 text-center">
              <Library className="w-16 h-16 text-gray-700 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">Aún no tienes cursos</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                Tu biblioteca está vacía. Es el momento perfecto para visitar el catálogo y apuntarte a tu primera formación premium.
              </p>
              <Link href="/cursos" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg inline-flex items-center gap-2">
                Ir al Catálogo
              </Link>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myAccesses.map((access) => {
              const course = access.course;
              return (
                <div key={course.id} className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden flex flex-col group hover:border-purple-500/50 transition-colors">
                  <div className="relative aspect-video w-full bg-gray-950 flex items-center justify-center overflow-hidden">
                    {course.thumbnailUrl ? (
                      <Image 
                        src={course.thumbnailUrl} 
                        alt={course.title} 
                        fill 
                        className="object-cover opacity-80 group-hover:opacity-100 transition-all group-hover:scale-105" 
                      />
                    ) : (
                      <PlayCircle className="w-12 h-12 text-gray-800" />
                    )}
                    {/* Botón flotante Play animado */}
                    <Link href={`/cursos/${course.id}`} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm z-10">
                      <div className="bg-purple-600 rounded-full p-4 shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                        <PlayCircle className="w-8 h-8 text-white" />
                      </div>
                    </Link>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-xl text-white mb-3 line-clamp-1">{course.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-6">
                      Sigue formándote en esta disciplina.
                    </p>
                    
                    {/* Fake Progress Bar (Esto se calculará real cuando las lessons estén implementadas al 100%) */}
                    <div className="mt-auto">
                      <div className="flex justify-between text-xs mb-2 font-medium text-gray-400">
                        <span>Progreso de lecciones</span>
                        <span className="text-purple-400">100% Acceso desbloqueado</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
