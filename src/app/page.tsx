import Link from 'next/link';
import { ArrowRight, MonitorPlay, ShieldCheck, Zap } from 'lucide-react';
import { InterestButton } from '@/components/marketing/InterestButton';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 font-sans text-gray-100 selection:bg-purple-500/30">
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-0 w-[40vw] h-[40vw] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 max-w-7xl mx-auto px-6 lg:px-8 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/50 border border-gray-800 text-sm text-purple-300 font-medium mb-8 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          Lanzamiento oficial en breves
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8">
          Domina la creación 3D <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 animate-gradient-x">
            sin límites ni excusas
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-2xl text-center leading-relaxed">
          La primera academia premium especializada en Blender y Unreal Engine con un sistema de aprendizaje anti-interrupciones, DRM en tiempo real y comunidad privada.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link 
            href="/cursos"
            className="w-full sm:w-auto bg-white hover:bg-gray-200 text-black font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-1"
          >
            Ver Catálogo
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            href="/sign-up"
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>

      {/* Catcher Lead (Mailerlite Section) */}
      <div className="relative max-w-4xl mx-auto px-6 my-10">
        <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 isolate">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2 text-white">¿Aún no te decides?</h3>
            <p className="text-gray-400">Apúntate a la lista y te avisaremos cuando abramos plazas o saquemos cursos gratuitos de introducción.</p>
          </div>
          <InterestButton />
        </div>
      </div>

      {/* Feature grid */}
      <div className="relative max-w-7xl mx-auto px-6 py-24 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<MonitorPlay className="w-8 h-8 text-blue-400" />}
            title="Calidad AV1 + HLS"
            desc="Tus lecciones cargan al instante en máxima calidad, da igual si estás en fibra óptica o con datos móviles en la calle."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-8 h-8 text-purple-400" />}
            title="Plataforma Blindada"
            desc="Dile adiós a la piratería. DRM personalizado, marca de agua con tu cuenta y bloqueo automático de extracción."
          />
          <FeatureCard 
            icon={<Zap className="w-8 h-8 text-green-400" />}
            title="Progreso Inteligente"
            desc="Apuntes privados fijados al segundo exacto de la lección para que no pierdas nunca el hilo de tu aprendizaje."
          />
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="border-t border-gray-900 bg-gray-950/50 py-12 text-center text-gray-500">
        <p>© 2026 Videocursos. Diseño Premium Exclusivo.</p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-gray-900/30 backdrop-blur-lg border border-gray-800/80 p-8 rounded-3xl hover:bg-gray-900/50 transition-all hover:-translate-y-2 group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-500">
        {icon}
      </div>
      <div className="bg-gray-950 border border-gray-800 w-16 h-16 flex items-center justify-center rounded-2xl mb-6 shadow-lg">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-100 mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}
