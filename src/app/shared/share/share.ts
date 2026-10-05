import { Component, input, signal } from '@angular/core';
import { toBlob } from 'html-to-image';

/**
 * Compartir el resultado.
 *
 * Se captura el ELEMENTO REAL que el visitante está viendo, no una
 * reconstrucción. Por eso la imagen compartida es idéntica a la pantalla:
 * mismo diseno, misma luna, mismo grabado, mismos textos.
 *
 * Como el resultado vive en la URL, el enlace tambien lleva todo el resultado.
 * La imagen es para las redes; el enlace es para quien quiera rehacerlo.
 *
 * Nota sobre privacidad: la captura ocurre en el navegador. La imagen no se
 * sube a ningun sitio. Solo se usa para el portapapeles o la descarga, o se
 * pasa a la app de compartir del sistema si el visitante lo elige.
 */
@Component({
  selector: 'app-share',
  standalone: true,
  template: `
    <div class="share">
      <p class="label">Comparte tu resultado</p>

      <div class="row">
        <button type="button" class="net" (click)="share()" [disabled]="busy()">
          <span class="glyph" aria-hidden="true">↑</span>
          <span class="name">Compartir imagen</span>
        </button>

        <button type="button" class="net" (click)="download()" [disabled]="busy()">
          <span class="glyph" aria-hidden="true">↓</span>
          <span class="name">Guardar imagen</span>
        </button>

        <button type="button" class="net" (click)="copyLink()">
          <span class="glyph" aria-hidden="true">⧉</span>
          <span class="name">Copiar enlace</span>
        </button>
      </div>

      <p class="hint" aria-live="polite">{{ message() }}</p>
    </div>
  `,
  styles: [
    `
      .share { display: grid; gap: 0.9rem; justify-items: center; }

      .label {
        margin: 0;
        color: #9a8f74;
        font-size: 0.72rem;
        letter-spacing: 0.24em;
        text-transform: uppercase;
      }

      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        justify-content: center;
      }

      .net {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 0.95rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(245, 199, 106, 0.2);
        border-radius: 2px;
        color: #cfc9b8;
        font: inherit;
        font-size: 0.85rem;
        cursor: pointer;
        transition: border-color 0.3s ease, color 0.3s ease, background 0.3s ease;
      }

      .net:hover:not(:disabled) {
        border-color: rgba(245, 199, 106, 0.55);
        background: rgba(245, 199, 106, 0.05);
        color: #f5c76a;
      }

      .net:disabled { opacity: 0.4; cursor: default; }

      .net:focus-visible {
        outline: 1px solid rgba(245, 199, 106, 0.65);
        outline-offset: 3px;
      }

      .glyph {
        display: grid;
        place-items: center;
        width: 1.1rem;
        height: 1.1rem;
        border: 1px solid rgba(245, 199, 106, 0.3);
        border-radius: 2px;
        font-size: 0.7rem;
        line-height: 1;
      }

      .hint { margin: 0; color: #8d8474; font-size: 0.82rem; min-height: 1.2em; }

      @media (max-width: 30rem) {
        .name { display: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        .net { transition: none; }
      }
    `,
  ],
})
export class ShareComponent {
  /** Elemento a capturar. Lo pasa la pagina de resultado. */
  readonly target = input.required<HTMLElement>();

  readonly filename = input<string>('madar.png');
  readonly shareTitle = input<string>('Lo que soy en Madar');

  readonly busy = signal(false);
  readonly message = signal('');

  /** Web Share API: no existe en todos los navegadores. */
  private readonly canShareFiles =
    typeof navigator !== 'undefined' && 'canShare' in navigator;

  /**
   * Captura el elemento real.
   *
   * width/height se dejan sin fijar a proposito: se usa el tamaño real en
   * pantalla, que es lo que el visitante ve. Fijarlo daria una imagen con
   * margenes Unexpectedly grandes en moviles.
   */
  private async capture(): Promise<Blob | null> {
    const node = this.target();
    try {
      return await toBlob(node, {
        // El fondo es transparente y se veria el color del body. Se fija el
        // fondo real de la pagina para que la imagen sea la que se ve.
        backgroundColor: '#05060a',
        cacheBust: true,
        pixelRatio: 2,
        // Los grabados son SVG inline y se copian sin problema. El cielo
        // esta en un componente aparte, fuera del objetivo.
      });
    } catch {
      this.message.set('No se ha podido generar la imagen.');
      return null;
    }
  }

  async share(): Promise<void> {
    this.busy.set(true);
    this.message.set('Preparando…');
    try {
      const blob = await this.capture();
      if (!blob) return;

      const file = new File([blob], this.filename(), { type: 'image/png' });

      if (this.canShareFiles && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: this.shareTitle(),
          text: this.shareTitle(),
          url: location.href,
        });
        this.message.set('Compartido.');
      } else {
        // Sin Web Share API: se descarga la imagen y se copia el enlace.
        this.saveBlob(blob);
        await this.copyLink(true);
      }
    } catch {
      // El visitante puede cancelar el dialogo de compartir: no es un error.
      this.message.set('');
    } finally {
      this.busy.set(false);
    }
  }

  async download(): Promise<void> {
    this.busy.set(true);
    this.message.set('Generando…');
    try {
      const blob = await this.capture();
      if (blob) {
        this.saveBlob(blob);
        this.message.set('Imagen guardada.');
      }
    } finally {
      this.busy.set(false);
    }
  }

  private saveBlob(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filename();
    a.click();
    URL.revokeObjectURL(url);
  }

  async copyLink(silencioso = false): Promise<void> {
    try {
      await navigator.clipboard.writeText(location.href);
      this.message.set(silencioso ? 'Imagen guardada y enlace copiado.' : 'Enlace copiado.');
    } catch {
      this.message.set(silencioso ? 'Imagen guardada.' : 'No se ha podido copiar el enlace.');
    }
  }
}