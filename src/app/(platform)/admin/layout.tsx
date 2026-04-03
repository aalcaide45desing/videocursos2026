import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import Link from 'next/link';
import { LayoutDashboard, Video, Users, LogOut, ListOrdered, ExternalLink } from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Barrera de Seguridad: Si no tiene el rol de admin en Clerk, a la calle.
  // Para darte a ti mismo el rol, deberás ir al Dashboard de Clerk -> Users -> Edit
  // Y poner en "public_metadata": {"role": "admin"}
  const isUserAdmin = await isAdmin();
  
  if (!isUserAdmin) {
    redirect('/'); // O a la pestaña de cursos si lo prefieres
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
      {/* Sidebar de navegación */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-800">
          <h2 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Admin Panel
          </h2>
          <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">
            Videocursos 2026
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-all">
            <LayoutDashboard className="w-5 h-5 text-blue-400" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/cursos" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-all">
            <Video className="w-5 h-5 text-purple-400" />
            <span className="font-medium">Cursos</span>
          </Link>
          <Link href="/admin/lecciones" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-all">
            <ListOrdered className="w-5 h-5 text-blue-300" />
            <span className="font-medium">Lecciones</span>
          </Link>
          <Link href="/admin/accesos" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-all">
            <Users className="w-5 h-5 text-green-400" />
            <span className="font-medium">Accesos y Seguridad</span>
          </Link>
          <div className="pt-4 mt-4 border-t border-gray-800">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-900/20 rounded-xl transition-all">
              <ExternalLink className="w-5 h-5" />
              <span className="font-medium font-bold">Ver Academia</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex w-full items-center gap-3 px-4 py-3 text-red-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-all">
            <LogOut className="w-5 h-5" />
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
