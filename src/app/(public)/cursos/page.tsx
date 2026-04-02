import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Catálogo de Cursos | Videocursos 2026',
  description: 'Explora nuestra selección de cursos premium en Blender y Unreal Engine con la máxima calidad y protección.',
};

export default async function CursosPage() {
  // Solo mostramos los cursos que están marcados como "isPublished = true"
  const publishedCourses = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    orderBy: [desc(courses.createdAt)],
  });

  return (
    <main className="min-h-screen bg-gray-950 font-sans text-gray-100 pt-32 pb-24">
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header Catálogo */}
        <div className="mb-16 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Nuestros <span className="text-purple-400">Cursos</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl">
            Aprende habilidades de alto valor con calidad cinematográfica. Acceso de por vida, comunidad privada y cero interrupciones.
          </p>
        </div>

        {/* Grid de Cursos */}
        {publishedCourses.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-16 text-center backdrop-blur-xl">
            <ShieldCheck className="w-16 h-16 text-gray-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Preparando los contenidos</h3>
            <p className="text-gray-400">Aún no hay cursos publicados. Apúntate a la newsletter para ser el primero en enterarte.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {publishedCourses.map((course) => (
              <Link 
                href={`/cursos/${course.id}`} 
                key={course.id}
                className="group flex flex-col bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl overflow-hidden hover:border-purple-500/50 hover:bg-gray-900/60 transition-all hover:-translate-y-2 relative"
              >
                {/* Imagen del curso */}
                <div className="relative aspect-video w-full bg-gray-950 overflow-hidden">
                  {course.thumbnailUrl ? (
                    <Image 
                      src={course.thumbnailUrl} 
                      alt={course.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <PlayCircle className="w-12 h-12 text-gray-800" />
                    </div>
                  )}
                  {/* Badge Precio */}
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-white font-bold px-3 py-1 rounded-xl border border-gray-800 shadow-xl">
                    {course.price ? `${course.price} €` : 'GRATIS'}
                  </div>
                </div>

                {/* Info del curso */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center text-purple-400 font-medium text-sm group-hover:gap-2 gap-1 transition-all">
                    Ver temario completo <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  );
}
