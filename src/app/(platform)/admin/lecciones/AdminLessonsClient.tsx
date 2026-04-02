'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListVideo, GripVertical, Settings2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AddLessonModal } from '@/components/admin/AddLessonModal';

interface Course {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
  megaS4MasterPath: string;
  durationSeconds: number | null;
  isFree: boolean;
  order: number;
}

interface AdminLessonsClientProps {
  allCourses: Course[];
  activeCourseId: string | null;
  initialLessons: Lesson[];
}

export function AdminLessonsClient({ allCourses, activeCourseId, initialLessons }: AdminLessonsClientProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [showModal, setShowModal] = useState(false);

  const handleLessonAdded = (lesson: Lesson) => {
    setLessons((prev) => [...prev, lesson].sort((a, b) => a.order - b.order));
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm('¿Eliminar esta lección? Se borrarán también todos los progresos y notas asociadas.')) return;
    const res = await fetch(`/api/admin/lessons?id=${lessonId}`, { method: 'DELETE' });
    if (res.ok) {
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')} min`;
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Temario y Lecciones</h1>
          <p className="text-gray-400">Organiza el temario de tus cursos.</p>
        </div>

        {activeCourseId && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Lección
          </button>
        )}
      </div>

      {allCourses.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-gray-800 rounded-2xl">
          <ListVideo className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">Primero crea un curso para añadirle lecciones.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Selector de Cursos */}
          <div className="w-full lg:w-1/4 bg-gray-900 border border-gray-800 rounded-2xl p-4 h-fit">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Cursos</h3>
            <div className="space-y-1">
              {allCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/admin/lecciones?courseId=${course.id}`}
                  className={`block px-4 py-3 rounded-lg transition-colors font-medium text-sm ${
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

          {/* Lista de lecciones */}
          <div className="w-full lg:w-3/4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <span className="font-semibold text-gray-300">Playlist</span>
                <span className="text-sm font-mono text-gray-500">{lessons.length} vídeos</span>
              </div>

              <div className="p-4 space-y-2">
                {lessons.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-sm">
                    No hay lecciones aún. Pulsa "Nueva Lección" para añadir la primera.
                  </div>
                ) : (
                  lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="group flex items-center justify-between p-3 border border-gray-800 bg-gray-900/50 rounded-xl hover:border-purple-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <GripVertical className="w-5 h-5 text-gray-600 shrink-0" />
                        <span className="w-6 text-center font-mono text-sm text-gray-500 font-bold shrink-0">{idx + 1}</span>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-200 truncate">{lesson.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {lesson.isFree && (
                              <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-bold">GRATIS</span>
                            )}
                            {lesson.megaS4MasterPath ? (
                              <span className="text-xs text-green-400">✔ Vídeo enlazado</span>
                            ) : (
                              <span className="text-xs text-yellow-500">⚠ Sin vídeo</span>
                            )}
                            {lesson.durationSeconds && (
                              <span className="text-xs text-gray-500">{formatDuration(lesson.durationSeconds)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Eliminar lección"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && activeCourseId && (
        <AddLessonModal
          courseId={activeCourseId}
          nextOrder={lessons.length}
          onClose={() => setShowModal(false)}
          onAdded={handleLessonAdded}
        />
      )}
    </div>
  );
}
