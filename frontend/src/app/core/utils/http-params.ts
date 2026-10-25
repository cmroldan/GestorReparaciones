import { HttpParams } from '@angular/common/http';

/**
 * Construye HttpParams ignorando los valores undefined, para no enviar
 * parámetros de consulta vacíos ("undefined") al backend.
 */
export function buildQueryParams(
  values: Record<string, string | number | boolean | undefined>,
): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      params = params.set(key, value);
    }
  }
  return params;
}
