import { db } from '@/db';
import { lessons, courses, userCourseAccess, lessonProgress } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAuth, isAdmin } from '@/lib/auth';
import { LessonPlayer } from '@/components/video/LessonPlayer';
import { LessonComments } from '@/components/video/LessonComments';
import { ClientPlayWrapper } from './ClientPlayWrapper'; 

export const metadata = {
  title: 'Reproductor | Videocursos 2026',
};

export default async function PlayLessonPage(props: { params: Promise<{ lessonId: string }> }) {
  const params = await props.params;
  // 1. Autenticación y Verificación de la Lección
  const { userId } = await requireAuth();
  const isUserAdmin = await isAdmin();
  
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, params.lessonId));
  if (!lesson) notFound();

  // 2. Comprobar seguridad: ¿Ha pagado el usuario o es gratis? (Los admins pasan gratis)
  if (!lesson.isFree && !isUserAdmin) {
    const [access] = await db
      .select()
      .from(userCourseAccess)
      .where(and(eq(userCourseAccess.userId, userId), eq(userCourseAccess.courseId, lesson.courseId)));

    if (!access) {
      redirect(`/cursos/${lesson.courseId}`); // Bloqueado, redirigido a comprar
    }
  }

  // 3. Obtener el progreso previo de este usuario para esta lección concreta
  let initialTimeSecs = 0;
  const [progress] = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lesson.id)));
  
  if (progress && progress.lastPositionSeconds) {
    // Restamos 5 segundos para que recuerden el contexto al reanudar
    initialTimeSecs = Math.max(0, progress.lastPositionSeconds - 5);
  }

  return (
    <div className="min-h-screen bg-black font-sans text-gray-100 flex flex-col md:flex-row overflow-hidden">
      
      {/* Columna Principal: Reproductor y Foro */}
      <div className="flex-1 overflow-y-auto w-full h-screen custom-scrollbar">
        
        {/* Cabecera minimalista superior con Botones de Navegación */}
        <header className="p-6 pb-0 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
             <Link href={`/cursos/${lesson.courseId}`} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold bg-gray-900 px-4 py-2 rounded-xl">
               ← Volver al Temario
             </Link>
             {isUserAdmin && (
               <Link href="/admin/lecciones" className="text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-2 text-sm font-bold bg-yellow-900/20 shadow-lg px-4 py-2 rounded-xl">
                 ⚙️ Ir a Administración
               </Link>
             )}
          </div>
          <div className="text-purple-400 font-bold uppercase tracking-widest text-xs mb-2">
            Módulo interactivo
          </div>
          <h1 className="text-3xl font-bold text-white mb-6 leading-tight">{lesson.title}</h1>
        </header>

        {/* El Componente Cliente agrupará el Reproductor y las Notas para pasarse el tiempo actual */}
        <ClientPlayWrapper 
          lessonId={lesson.id}
          initialTimeSecs={initialTimeSecs}
          durationSeconds={lesson.durationSeconds}
        />

        {/* Zona de Foro (Comentarios públicos) */}
        <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-12 pb-24">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl">
            <LessonComments lessonId={lesson.id} />
          </div>
        </div>

      </div>

    </div>
  );
}
