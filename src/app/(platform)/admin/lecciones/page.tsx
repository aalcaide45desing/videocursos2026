import { db } from '@/db';
import { courses, lessons } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { AdminLessonsClient } from './AdminLessonsClient';
import { redirect } from 'next/navigation';

export default async function AdminLessonsPage({ searchParams }: { searchParams: { courseId?: string } }) {
  const allCourses = await db.query.courses.findMany();

  if (!searchParams.courseId && allCourses.length > 0) {
    redirect(`/admin/lecciones?courseId=${allCourses[0].id}`);
  }

  const activeCourseId = searchParams.courseId ?? null;
  let initialLessons: any[] = [];

  if (activeCourseId) {
    initialLessons = await db.query.lessons.findMany({
      where: eq(lessons.courseId, activeCourseId),
      orderBy: [asc(lessons.order)],
    });
  }

  return (
    <AdminLessonsClient
      allCourses={allCourses}
      activeCourseId={activeCourseId}
      initialLessons={initialLessons}
    />
  );
}
