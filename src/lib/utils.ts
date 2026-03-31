import { type ClassValue, clsx } from 'clsx';

/**
 * Combina clases CSS condicionales (compatible con Tailwind).
 * Instalar clsx: npm install clsx
 */
export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Formatea segundos a "mm:ss" o "h:mm:ss"
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Genera un slug a partir de un texto (ej: "Blender Desde Cero" → "blender-desde-cero")
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // eliminar diacríticos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Formatea una fecha relativa (ej: "hace 2 horas")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours} h`;
  if (days < 7) return `hace ${days} días`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
