import { Injectable } from '@angular/core';
import { toBlob } from 'html-to-image';

/**
 * Genera la imagen del resultado y la ofrece para compartir o descargar.
 *
 * TODO EN EL NAVEGADOR, sin servidor: html-to-image serializa el nodo a PNG
 * en el cliente. La libreria ya estaba en package.json (se uso antes y se
 * retiro); aqui se reincorpora como parte del boton de compartir.
 *
 * El flujo es:
 *   1. Se captura el nodo app-share-card, que mide 1200x630.
 *   2. Si el navegador soporta Web Share con archivos, se abre el selector de
 *      compartir del sistema con la imagen adjunta.
 *   3. Si no lo soporta, o el usuario cancela, se descarga el PNG.
 *
 * Nada de esto depende de la red ni de una API de generacion de imagenes.
 */
@Injectable({ providedIn: 'root' })
export class ShareService {
  /**
   * Captura un nodo como PNG de 1200x630.
   *
   * @param node el elemento app-share-card ya renderizado
   * @returns el blob PNG, o null si el navegador no puede generarlo
   */
  async capture(node: HTMLElement): Promise<Blob | null> {
    try {
      return await toBlob(node, {
        width: 1200,
        height: 630,
        // pixelRatio 1 para que el PNG salga a 1200x630 exactos y no al doble.
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: '#050816',
      });
    } catch {
      // Un PNG es un extra. Si falla, no se rompe la pagina: se avisa y ya.
      return null;
    }
  }

  /**
   * Intenta compartir la imagen con la Web Share API.
   *
   * @returns true si se abrio el selector de compartir del sistema.
   *   false si no se pudo y hay que offersela como descarga.
   */
  async canShareFile(blob: Blob): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('canShare' in navigator)) {
      return false;
    }
    const file = new File([blob], 'tu-resultado-madar.png', { type: blob.type });
    try {
      return navigator.canShare({ files: [file] });
    } catch {
      return false;
    }
  }

  /** Abre el selector de compartir del sistema con la imagen. */
  async shareFile(blob: Blob, title: string, text: string): Promise<void> {
    const file = new File([blob], 'tu-resultado-madar.png', { type: blob.type });
    await navigator.share({ files: [file], title, text });
  }

  /** Descarga el PNG. Es el camino cuando compartir no existe o no funciona. */
  download(blob: Blob, filename = 'tu-resultado-madar.png'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}