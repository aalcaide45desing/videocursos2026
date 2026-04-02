import { db } from '@/db';
import { users, courses, userCourseAccess, comments } from '@/db/schema';
import { count, eq } from 'drizzle-orm';
import { Users, Video, ShieldAlert, MessageSquare } from 'lucide-react';

export default async function AdminDashboard() {
  // Obtenemos de golpe las estadísticas generales
  const [
    totalUsersResponse,
    totalCoursesResponse,
    totalAccessResponse,
    suspendedUsersResponse,
    totalCommentsResponse
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(courses),
    db.select({ value: count() }).from(userCourseAccess),
    db.select({ value: count() }).from(users).where(eq(users.isSuspended, true)),
    db.select({ value: count() }).from(comments),
  ]);

  const stats = [
    {
      title: 'Total Alumnos',
      value: totalUsersResponse[0].value,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    {
      title: 'Cursos Activos',
      value: totalCoursesResponse[0].value,
      icon: Video,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10'
    },
    {
      title: 'Ventas (Accesos)',
      value: totalAccessResponse[0].value,
      icon: Users,
      color: 'text-green-400',
      bg: 'bg-green-400/10'
    },
    {
      title: 'Foro (Dudas totales)',
      value: totalCommentsResponse[0].value,
      icon: MessageSquare,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10'
    },
    {
      title: 'Cuentas Suspendidas',
      value: suspendedUsersResponse[0].value,
      icon: ShieldAlert,
      color: suspendedUsersResponse[0].value > 0 ? 'text-red-400' : 'text-gray-400',
      bg: suspendedUsersResponse[0].value > 0 ? 'bg-red-400/10' : 'bg-gray-800'
    }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Panel de Control</h1>
        <p className="text-gray-400">Visión general del estado de la academia Videocursos 2026.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex items-center gap-5">
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400 font-medium">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">¿Siguientes pasos?</h3>
        <p className="text-gray-400 leading-relaxed max-w-3xl">
          Utiliza la barra lateral para gestionar los cursos (crear nuevos y subir temarios) o vigilar la sección de Accesos Reales, donde verás los alumnos que se han ido sincronizando y los posibles baneos por exceso de intentos en el reproductor protegido por DRM.
        </p>
      </div>
    </div>
  );
}
