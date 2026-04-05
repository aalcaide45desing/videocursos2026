import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EditCourseForm } from '@/components/admin/EditCourseForm';

export default async function AdminEditCoursePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [course] = await db.select().from(courses).where(eq(courses.id, params.id));
  
  if (!course) notFound();

  return (
    <div className="p-8 max-w-4xl min-h-screen">
      <Link href="/admin/cursos" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver a cursos
      </Link>
      
      <EditCourseForm course={course} />
    </div>
  );
}
