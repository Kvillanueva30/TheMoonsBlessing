/**
 * Resuelve la URL de un asset del proyecto respetando el <base href>.
 *
 * No se puede pedir un asset con ruta absoluta del tipo '/data/x.json'. En
 * desarrollo funciona porque el servidor sirve en la raiz, pero en GitHub
 * Pages el proyecto vive bajo /<repositorio>/, y '/data/...' resolveria contra
 * la raiz del dominio. Comprobado contra el sitio desplegado:
 *
 *   /TheMoonsBlessing/data/results/results.json  -> 200
 *   /data/results/results.json                    -> 404
 *
 * Resolver contra document.baseURI hace que el mismo codigo funcione en local,
 * en Pages y, mas adelante, integrado en el sitio de BETWEEN.
 *
 * El path es relativo a proposito: no debe empezar por '/'.
 */
export function assetUrl(path: string): string {
  if (path.startsWith('/')) {
    throw new Error(`assetUrl espera una ruta relativa, recibio "${path}". Una ruta absoluta ignora el <base href> y devuelve 404 en GitHub Pages.`);
  }
  return new URL(path, document.baseURI).toString();
}
