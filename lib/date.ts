/**
 * Bibliothèque de gestion des dates pour Budgix Admin
 *
 * Standards :
 * - **API** : ISO 8601 (2026-01-26T14:30:00.000Z)
 * - **Affichage standard** : jj/mm/aaaa (26/01/2026)
 * - **Affichage long** : j MMMM aaaa (26 janvier 2026)
 * - **Affichage relatif** : "il y a 5 min", "hier à 14h30"
 */

import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Parse une date ISO 8601 et retourne un objet Date
 */
export const parseISODate = (isoString: string): Date => {
  try {
    return parseISO(isoString);
  } catch (error) {
    throw new Error(`Format de date ISO 8601 invalide: ${isoString}`);
  }
};

/**
 * Formate une date en jj/mm/aaaa (format d'affichage standard)
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: fr });
};

/**
 * Formate une date au format long : j MMMM aaaa
 */
export const formatDateLong = (date: Date | string): string => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMMM yyyy", { locale: fr });
};

/**
 * Formate une date avec "1er" pour le premier jour du mois
 */
export const formatDateWithFirst = (date: Date | string): string => {
  const d = typeof date === "string" ? parseISO(date) : date;
  const day = d.getDate();

  if (day === 1) {
    return format(d, "'1er' MMMM yyyy", { locale: fr });
  }

  return format(d, "d MMMM yyyy", { locale: fr });
};

/**
 * Formate une date avec date et heure : jj/mm/aaaa HH:mm
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: fr });
};

/**
 * Formate uniquement l'heure : HH:mm
 */
export const formatTime = (date: Date | string): string => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm");
};

/**
 * Formate une date de manière relative et conviviale en français
 *
 * Formats :
 * - "à l'instant" (< 30 secondes)
 * - "il y a X minutes"
 * - "Aujourd'hui à HH:mm"
 * - "Hier à HH:mm"
 * - "il y a X jours"
 * - "d MMMM" (cette année)
 * - "d MMMM yyyy" (autre année)
 */
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  // Moins de 30 secondes
  if (diffInSeconds < 30) {
    return "à l'instant";
  }

  // Moins d'une minute
  if (diffInSeconds < 60) {
    return `il y a ${diffInSeconds} secondes`;
  }

  // Moins d'une heure
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `il y a ${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""}`;
  }

  // Aujourd'hui
  if (isToday(d)) {
    return `Aujourd'hui à ${format(d, "HH:mm")}`;
  }

  // Hier
  if (isYesterday(d)) {
    return `Hier à ${format(d, "HH:mm")}`;
  }

  // Moins d'une semaine
  const diffInHours = Math.floor(diffInSeconds / 3600);
  if (diffInHours < 168) {
    // 7 jours
    return `il y a ${Math.floor(diffInHours / 24)} jour${Math.floor(diffInHours / 24) > 1 ? "s" : ""}`;
  }

  // Cette année
  if (d.getFullYear() === now.getFullYear()) {
    return format(d, "d MMMM", { locale: fr });
  }

  // Année différente
  return format(d, "d MMMM yyyy", { locale: fr });
};

/**
 * Formate une date en ISO 8601 pour envoi API
 */
export const formatDateISO = (date: Date): string => {
  return date.toISOString();
};

/**
 * Formate un montant en FCFA
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
};
