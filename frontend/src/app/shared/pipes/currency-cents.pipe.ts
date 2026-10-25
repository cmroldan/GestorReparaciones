import { Pipe, PipeTransform } from '@angular/core';

import { formatCents } from '../../core/utils/money';

/** Formatea centavos enteros como importe argentino: 123450 → "$ 1.234,50". */
@Pipe({
  name: 'currencyCents',
})
export class CurrencyCentsPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCents(value ?? 0);
  }
}
