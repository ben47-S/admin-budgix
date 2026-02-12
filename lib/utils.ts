import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combine les classes CSS avec clsx et tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Exporter les fonctions de date depuis lib/date.ts
 * Format unifié : ISO 8601 pour API, jj/mm/aaaa pour affichage
 */
export {
  parseISODate,
  formatDate,
  formatDateLong,
  formatDateWithFirst,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatDateISO,
  formatCurrency,
} from "./date";

