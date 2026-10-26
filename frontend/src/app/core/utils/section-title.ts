const SECTION_TITLES: ReadonlyArray<readonly [string, string]> = [
  ['/clientes', 'Clientes'],
  ['/inventario', 'Inventario'],
  ['/ordenes', 'Órdenes'],
  ['/ventas', 'Ventas'],
];

/**
 * Devuelve el título de la sección que corresponde a la URL actual. Las rutas
 * de detalle y las subrutas conservan el título de su sección padre.
 */
export function sectionTitle(url: string): string {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, '') || '/';

  if (path === '/') {
    return 'Resumen';
  }

  const match = SECTION_TITLES.find(
    ([prefix]) => path === prefix || path.startsWith(`${prefix}/`),
  );

  return match?.[1] ?? 'Resumen';
}
