import { db } from '@/db';
import { users, userCourseAccess, courses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ShieldCheck, ShieldAlert, Key, Ban } from 'lucide-react';
import Image from 'next/image';

export default async function AdminAccessPage() {
  // Obtenemos todos los accesos con la informacin del usuario y el curso cruzada
  const accesses = await db.query.userCourseAccess.findMany({
    orderBy: [desc(userCourseAccess.grantedAt)],
    with: {
      user: true,
      course: true,
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Monitor de Accesos</h1>
        <p className="text-gray-400">Vigila quién tiene acceso a qué. Expulsa a piratas o regala accesos manuales.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-900 border-b border-gray-800 text-gray-400 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Estudiante</th>
                <th className="px-6 py-4">Curso</th>
                <th className="px-6 py-4">Fecha de acceso</th>
                <th className="px-6 py-4">Estado Cuenta</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {accesses.map((access) => (
                <tr key={`${access.userId}-${access.courseId}`} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden relative">
                        {access.user.avatarUrl ? (
                          <Image src={access.user.avatarUrl} alt="avatar" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                            {access.user.firstName?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-200">
                          {access.user.firstName} {access.user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{access.user.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="font-medium text-purple-400 bg-purple-500/10 px-3 py-1 inline-block rounded-lg">
                      {access.course.title}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-400">
                    {access.grantedAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>

                  <td className="px-6 py-4">
                    {access.user.isSuspended ? (
                      <span className="inline-flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest">
                        <ShieldAlert className="w-3 h-3" />
                        Baneado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3" />
                        Limpio
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20" title="Revocar Acceso">
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {accesses.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Aún no hay alumnos con acceso a ningún curso.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
