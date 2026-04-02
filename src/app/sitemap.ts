import { MetadataRoute } from 'next';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Rutas estáticas de la web
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/cursos`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Rutas dinámicas de cursos catalogados (Solo los públicos)
  const publishedCourses = await db.select({
    id: courses.id,
    updatedAt: courses.updatedAt,
  }).from(courses).where(eq(courses.isPublished, true));

  const dynamicCourseRoutes = publishedCourses.map((course) => ({
    url: `${baseUrl}/cursos/${course.id}`,
    lastModified: course.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...dynamicCourseRoutes];
}
