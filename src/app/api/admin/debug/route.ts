import { NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, courses } from '@/db/schema';
import { isAdmin } from '@/lib/auth';

// GET /api/admin/debug — Solo admins. Muestra los datos de lecciones y configuración.
export async function GET() {
  const admin = await isAdmin();
  if (!admin) return new NextResponse('Forbidden', { status: 403 });

  const allLessons = await db.select().from(lessons);
  const allCourses = await db.select().from(courses);

  const endpoint = process.env.MEGA_S4_ENDPOINT;
  const bucket = process.env.MEGA_S4_BUCKET;

  const lessonDebug = allLessons.map((l) => ({
    id: l.id,
    title: l.title,
    courseId: l.courseId,
    megaS4MasterPath: l.megaS4MasterPath,
    isFree: l.isFree,
    computedUrl: l.megaS4MasterPath
      ? `${endpoint}/${bucket}/${l.megaS4MasterPath.replace(/^\/+/, '')}`
      : null,
  }));

  return NextResponse.json({
    config: { endpoint, bucket },
    courses: allCourses.map((c) => ({ id: c.id, title: c.title })),
    lessons: lessonDebug,
  });
}
