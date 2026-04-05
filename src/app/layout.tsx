import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import { esES } from '@clerk/localizations';
import { Toaster } from 'sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Videocursos 2026 — Cursos de Blender, Unreal Engine y más',
    template: '%s | Videocursos 2026',
  },
  description:
    'Plataforma de e-learning con cursos de alta calidad en Blender, Unreal Engine e Impresión 3D. Aprende con expertos en tiempo real.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    siteName: 'Videocursos 2026',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="es">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <Toaster position="top-center" richColors theme="dark" />
        </body>
      </html>
    </ClerkProvider>
  );
}
