import {
  pgTable,
  text,
  boolean,
  timestamp,
  uuid,
  integer,
  decimal,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// USERS — sincronizado con Clerk (id = Clerk userId)
// =============================================================================
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk userId
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),
  isSuspended: boolean('is_suspended').notNull().default(false),
  // Columnas para rate limiting anti-pirateria
  manifestRequestsCount: integer('manifest_requests_count').notNull().default(0),
  manifestRequestsLastReset: timestamp('manifest_requests_last_reset'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// COURSES — catálogo de cursos
// =============================================================================
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  thumbnailUrl: text('thumbnail_url'), // Ruta WebP en MEGA S4
  price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0'),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// LESSONS — lecciones dentro de un curso
// =============================================================================
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  order: integer('order').notNull().default(0),
  // Ruta relativa al master.m3u8 en MEGA S4 (ej: blender-desde-cero/leccion-01/master.m3u8)
  megaS4MasterPath: text('mega_s4_master_path').notNull().default(''),
  resourcesPath: text('resources_path'), // Ruta carpeta recursos descargables
  durationSeconds: integer('duration_seconds'), // Duración en segundos
  isFree: boolean('is_free').notNull().default(false), // Preview gratuita
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// LESSON_PROGRESS — progreso de reproducción del alumno
// =============================================================================
export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    lastPositionSeconds: integer('last_position_seconds').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userLessonUnique: unique().on(table.userId, table.lessonId),
  })
);

// =============================================================================
// COMMENTS — foro público de dudas por lección
// =============================================================================
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// PRIVATE_NOTES — notas privadas del alumno (con timestamp del video)
// =============================================================================
export const privateNotes = pgTable('private_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  timestampSeconds: integer('timestamp_seconds').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// USER_COURSE_ACCESS — pivot de acceso a cursos (compras/manual/regalo)
// =============================================================================
export const userCourseAccess = pgTable(
  'user_course_access',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at').notNull().defaultNow(),
    source: text('source').notNull().default('manual'), // 'hotmart' | 'manual' | 'gift'
  },
  (table) => ({
    userCourseUnique: unique().on(table.userId, table.courseId),
  })
);

// =============================================================================
// RELATIONS (Drizzle relational queries)
// =============================================================================
export const usersRelations = relations(users, ({ many }) => ({
  courseAccess: many(userCourseAccess),
  lessonProgress: many(lessonProgress),
  comments: many(comments),
  privateNotes: many(privateNotes),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
  userAccess: many(userCourseAccess),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  progress: many(lessonProgress),
  comments: many(comments),
  privateNotes: many(privateNotes),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(users, { fields: [lessonProgress.userId], references: [users.id] }),
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  lesson: one(lessons, { fields: [comments.lessonId], references: [lessons.id] }),
}));

export const privateNotesRelations = relations(privateNotes, ({ one }) => ({
  user: one(users, { fields: [privateNotes.userId], references: [users.id] }),
  lesson: one(lessons, { fields: [privateNotes.lessonId], references: [lessons.id] }),
}));

export const userCourseAccessRelations = relations(userCourseAccess, ({ one }) => ({
  user: one(users, { fields: [userCourseAccess.userId], references: [users.id] }),
  course: one(courses, { fields: [userCourseAccess.courseId], references: [courses.id] }),
}));

// =============================================================================
// TYPE EXPORTS (inferidos directamente de Drizzle — sin paso de generación)
// =============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type NewLessonProgress = typeof lessonProgress.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type PrivateNote = typeof privateNotes.$inferSelect;
export type NewPrivateNote = typeof privateNotes.$inferInsert;
export type UserCourseAccess = typeof userCourseAccess.$inferSelect;
export type NewUserCourseAccess = typeof userCourseAccess.$inferInsert;
