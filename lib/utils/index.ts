import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}

export function formatDate(date: string): string {
  // Crear fecha como fecha local (no UTC) para evitar problemas de zona horaria
  const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
  const localDate = new Date(year, month - 1, day); // month es 0-indexed
  
  return localDate.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: string): string {
  // Crear fecha como fecha local (no UTC) para evitar problemas de zona horaria
  const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
  const localDate = new Date(year, month - 1, day); // month es 0-indexed
  
  return localDate.toLocaleDateString('es-CL');
}
