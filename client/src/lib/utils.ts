import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como moneda según la moneda especificada
 */
export function formatCurrency(value: number, currency: 'ARS' | 'USD' = 'ARS'): string {
  return new Intl.NumberFormat(currency === 'ARS' ? 'es-AR' : 'en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
}
