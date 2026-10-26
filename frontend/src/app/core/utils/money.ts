/**
 * Utilidades monetarias: todos los importes viajan y se guardan como
 * enteros en centavos. Nunca se usan flotantes ni divisiones que generen
 * decimales; el formato únicamente divide la cadena de dígitos.
 */

export function formatCents(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  const digits = String(abs).padStart(3, '0');
  const units = digits.slice(0, -2);
  const decimals = digits.slice(-2);
  const formatted = `$ ${Number(units).toLocaleString('es-AR')},${decimals}`;
  return negative ? `-${formatted}` : formatted;
}

export function parseCents(value: string): number | null {
  const cleaned = value.replace(/\$/g, '').replace(/\./g, '').replace(/\s+/g, '');
  const match = /^(-)?(\d+)(?:,(\d{1,2}))?$/.exec(cleaned);
  if (!match) {
    return null;
  }
  const units = Number(match[2]);
  const decimals = Number((match[3] ?? '').padEnd(2, '0'));
  const total = units * 100 + decimals;
  return match[1] === '-' ? -total : total;
}
