/**
 * Utilidades de fecha del taller. Todas las claves de día se calculan en la
 * zona horaria del negocio para que un instante UTC cercano a la medianoche no
 * desplace el día ni el rango del mes.
 */

export const APP_TIMEZONE = 'America/Argentina/Buenos_Aires';

function localDateParts(now: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return { year: read('year'), month: read('month'), day: read('day') };
}

function toKey(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Día en curso en Argentina con formato `YYYY-MM-DD`. */
export function todayInArgentina(now: Date = new Date()): string {
  const { year, month, day } = localDateParts(now);
  return toKey(year, month, day);
}

/** Rango inclusivo del mes en curso en Argentina, del día 1 al día actual. */
export function monthRangeInArgentina(now: Date = new Date()): {
  from: string;
  to: string;
} {
  const { year, month, day } = localDateParts(now);
  return {
    from: toKey(year, month, 1),
    to: toKey(year, month, day),
  };
}

/** Fecha del encabezado, por ejemplo `Lunes, 26 de octubre`. */
export function formatHeaderDateInArgentina(now: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('es-AR', {
    timeZone: APP_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Fecha corta en Argentina, por ejemplo `25/10/2026`. */
export function formatDateInArgentina(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: APP_TIMEZONE,
    ...options,
  }).format(date);
}
