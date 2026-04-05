import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { Library, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { isAdmin } from '@/lib/auth';

export async function Navbar() {
  const { userId } = await auth();
  const isUserAdmin = await isAdmin();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-900 bg-gray-950/80 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Library className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg hidden sm:block">Videocursos</span>
          <span className="font-bold text-gray-500 text-lg hidden sm:block">2026</span>
        </Link>

        {/* Navegación central */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Inicio
          </Link>
          <Link href="/cursos" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Catálogo
          </Link>
          {userId && (
            <Link href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Mis Cursos
            </Link>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          {userId ? (
            <>
              {isUserAdmin && (
                <Link 
                  href="/admin" 
                  className="hidden sm:flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-full transition-colors border border-amber-500/20"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <Link 
                href="/dashboard" 
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors ml-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Mi Panel
              </Link>
              <div className="pl-3 ml-2 border-l border-gray-800">
                <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
              </div>
            </>
          ) : (
            <>
              <Link 
                href="/sign-in" 
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Entrar
              </Link>
              <Link 
                href="/sign-up"
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Regístrate gratis
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
