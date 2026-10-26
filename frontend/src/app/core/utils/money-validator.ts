import { AbstractControl, ValidationErrors } from '@angular/forms';

import { parseCents } from './money';

/** Importe obligatorio: vacío, no parseable o negativo son inválidos. */
export function moneyValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value && control.value !== 0) return { required: true };
  const cents = parseCents(String(control.value));
  if (cents === null || cents < 0) return { invalidMoney: true };
  return null;
}

/**
 * Importe opcional: vacío/blank significa "sin presupuesto" y es válido.
 * Si hay valor, debe parsearse como centavos y no ser negativo.
 */
export function optionalMoneyValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || String(value).trim().length === 0) return null;
  const cents = parseCents(String(value));
  if (cents === null || cents < 0) return { invalidMoney: true };
  return null;
}
