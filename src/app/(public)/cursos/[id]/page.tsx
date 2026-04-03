import { db } from '@/db';
import { courses, lessons } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Play, CheckCircle2, Shield } from 'lucide-react';
import { InterestButton } from '@/components/marketing/InterestButton';
import Link from 'next/link';

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [course] = await db.select().from(courses).where(eq(courses.id, params.id));
  if (!course) return { title: 'Curso no encontrado' };

  return {
    title: `${course.title} | Videocursos 2026`,
    description: course.description?.substring(0, 160) || 'Descubre este curso premium.',
    openGraph: {
      images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
    },
  };
}

export default async function CourseDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [course] = await db.select().from(courses).where(eq(courses.id, params.id));
  
  if (!course || !course.isPublished) {
    notFound();
  }

  // Cargar las lecciones para el bloque de temario
  const courseLessons = await db.query.lessons.findMany({
    where: eq(lessons.courseId, course.id),
    orderBy: [asc(lessons.order)],
  });

  // TODO: Generar JSON-LD estructurado de SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'Videocursos 2026',
    },
  };

  return (
    <main className="min-h-screen bg-gray-950 font-sans text-gray-100 pb-24">
      {/* Script SEO Google JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Dinámico */}
      <div className="relative pt-32 pb-20 overflow-hidden isolate">
        {course.thumbnailUrl && (
          <div className="absolute inset-0 -z-10 opacity-20">
            <Image src={course.thumbnailUrl} alt="Fondo" fill className="object-cover blur-3xl scale-110" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-gray-950/80 to-gray-950" />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-bold uppercase tracking-widest text-purple-400 mb-6">
              <Shield className="w-4 h-4" />
              Curso 100% Protegido
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white leading-tight">
              {course.title}
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
              {course.description}
            </p>

            {/* Zona de Venta Temporal / Hotmart / Catcher de Leads */}
            <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl backdrop-blur-md inline-block w-full sm:w-auto">
              <div className="text-3xl font-bold text-white mb-4">
                {course.price ? `${course.price} €` : 'Acceso Gratuito'}
              </div>
              <InterestButton />
              <p className="text-xs text-gray-500 mt-4 text-center sm:text-left">
                Garantía de reembolso de 15 días tras el lanzamiento oficial.
              </p>
            </div>
          </div>

          <div className="relative aspect-video rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black">
            {course.thumbnailUrl ? (
              <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-16 h-16 text-gray-800" />
              </div>
            )}
            {/* Play Button decorativo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                <Play className="w-8 h-8 text-white ml-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Temario del curso */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 mt-12">
        <h2 className="text-3xl font-bold text-white mb-8">Temario del curso</h2>
        
        {courseLessons.length === 0 ? (
          <div className="text-gray-500 bg-gray-900/30 border border-gray-800 p-8 rounded-2xl text-center">
            Las lecciones aún se están grabando. Estarán disponibles pronto.
          </div>
        ) : (
          <div className="space-y-4">
            {courseLessons.map((lesson, idx) => (
              <Link 
                href={`/play/${lesson.id}`} 
                key={lesson.id} 
                className="group flex items-center gap-4 bg-gray-900/50 hover:bg-gray-800 transition-colors border border-gray-800 p-4 rounded-2xl cursor-pointer"
              >
                <div className="w-10 h-10 bg-gray-950 flex items-center justify-center rounded-xl text-gray-500 group-hover:text-purple-400 group-hover:bg-purple-900/20 font-bold transition-all">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h4 className="text-gray-200 font-semibold group-hover:text-white transition-colors">{lesson.title}</h4>
                  {lesson.durationSeconds && (
                    <p className="text-xs text-gray-500 mt-1">{Math.floor(lesson.durationSeconds / 60)} minutos</p>
                  )}
                </div>
                {/* Indicador gratis o candado */}
                {lesson.isFree ? (
                  <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                    Demo Gratis
                  </span>
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-gray-600" />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}
