import { Component, computed, input, signal } from '@angular/core';
import { toBlob } from 'html-to-image';

/**
 * Compartir el resultado.
 *
 * Se captura el ELEMENTO REAL que el visitante esta viendo, no una
 * reconstruccion. La imagen compartida es identica a la pantalla.
 *
 * ----------------------------------------------------------------------------
 * POR QUE HAY DOS NIVELES
 * ----------------------------------------------------------------------------
 *
 * Un endpoint web de compartir (X, Facebook, Telegram) acepta una URL, no un
 * archivo. No existe forma de adjuntar desde el navegador una imagen generada
 * en local a esos sitios: haria falta el SDK de cada red con credenciales de
 * aplicacion, o subir la imagen a algun sitio publico. Ninguna de las dos
 * cosas es aceptable aqui.
 *
 * Lo que SI existe es la Web Share API del sistema: recibe el archivo y abre
 * el menu de compartir del dispositivo, que ya incluye WhatsApp, X, Telegram,
 * correo. Ahi el visitante elige donde y la imagen VA adjunta.
 *
 *   Nivel 1  "Compartir imagen"  -> menu del sistema, con la imagen adjunta.
 *   Nivel 2  boton por red        -> abre esa red con el ENLACE.
 *
 * El enlace no es un consolation prize: el resultado entero vive en la URL, asi
 * que quien lo reciba puede rehacer la ceremonia con su propia fecha.
 */
@Component({
  selector: 'app-share',
  standalone: true,
  template: `
    <div class="share">
      <p class="label">Comparte tu resultado</p>

      <!-- Nivel 1: la imagen va adjunta. -->
      @if (canShareFiles()) {
        <button type="button" class="primary" (click)="shareImage()" [disabled]="busy()">
          <span class="glyph" aria-hidden="true">↑</span>
          <span>Compartir la imagen</span>
        </button>
        <p class="hint">Elige la aplicación. La imagen va adjunta.</p>
      }

      <!-- Nivel 2: abrir una red concreta. Comparte el enlace. -->
      <div class="row">
        @for (net of networks; track net.id) {
          <button type="button" class="net" (click)="openNetwork(net)" [disabled]="busy()">
            <span class="glyph" aria-hidden="true">{{ net.glyph }}</span>
            <span class="name">{{ net.label }}</span>
          </button>
        }
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

      .row { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; }

      .primary,
      .net {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.7rem 1.2rem;
        background: rgba(245, 199, 106, 0.04);
        border: 1px solid rgba(245, 199, 106, 0.4);
        border-radius: 2px;
        color: #f5c76a;
        font: inherit;
        font-size: 0.9rem;
        cursor: pointer;
        transition: border-color 0.3s ease, background 0.3s ease, opacity 0.3s ease;
      }

      .primary:hover:not(:disabled) { border-color: #f5c76a; background: rgba(245, 199, 106, 0.09); }

      .net {
        background: rgba(255, 255, 255, 0.02);
        border-color: rgba(245, 199, 106, 0.2);
        color: #cfc9b8;
        font-size: 0.85rem;
      }

      .net:hover:not(:disabled) {
        border-color: rgba(245, 199, 106, 0.55);
        background: rgba(245, 199, 106, 0.05);
        color: #f5c76a;
      }

      .primary:disabled, .net:disabled { opacity: 0.4; cursor: default; }

      .primary:focus-visible, .net:focus-visible {
        outline: 1px solid rgba(245, 199, 106, 0.65);
        outline-offset: 3px;
      }

      .glyph {
        display: grid;
        place-items: center;
        width: 1.15rem;
        height: 1.15rem;
        border: 1px solid rgba(245, 199, 106, 0.32);
        border-radius: 2px;
        font-size: 0.68rem;
        line-height: 1;
      }

      .hint { margin: 0; color: #8d8474; font-size: 0.82rem; min-height: 1.2em; text-align: center; }

      @media (max-width: 30rem) {
        .primary span:last-child { display: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        .primary, .net { transition: none; }
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

  private readonly hasFileShare =
    typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';

  /**
   * Redes con endpoint web. Abren con el ENLACE, no con la imagen: ningun
   * endpoint web acepta un archivo local. Ver la nota de la cabecera.
   */
  readonly networks = [
    { id: 'x', label: 'X', glyph: 'X', build: (u: string, t: string) => `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { id: 'whatsapp', label: 'WhatsApp', glyph: 'W', build: (u: string, t: string) => `https://wa.me/?text=${t}%20${u}` },
    { id: 'telegram', label: 'Telegram', glyph: 'T', build: (u: string, t: string) => `https://t.me/share/url?url=${u}&text=${t}` },
    { id: 'facebook', label: 'Facebook', glyph: 'f', build: (u: string, t: string) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  ] as const;

  readonly canShareFiles = computed(() => this.hasFileShare);

  // -------------------------------------------------------------------------

  /**
   * Nivel 1: genera la imagen y abre el menu del sistema con ella adjunta.
   * El visitante elige la aplicacion ahi.
   */
  async shareImage(): Promise<void> {
    this.busy.set(true);
    this.message.set('Generando la imagen…');
    try {
      const blob = await this.capture();
      if (!blob) return;
      const file = new File([blob], this.filename(), { type: 'image/png' });

      if (!navigator.canShare?.({ files: [file] })) {
        this.message.set('Tu navegador no permite compartir la imagen. Se guarda.');
        this.save(blob);
        return;
      }

      await navigator.share({
        files: [file],
        title: this.shareTitle(),
        text: this.shareTitle(),
        url: location.href,
      });
      this.message.set('Compartido.');
    } catch {
      // Cancelar el dialogo no es un error.
      this.message.set('');
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * Nivel 2: abre la red elegida.
   *
   * Se genera la imagen y se guarda, para que el visitante la tenga a mano al
   * pegar. Compartir la imagen en la red no es posible sin su SDK.
   */
  async openNetwork(net: (typeof this.networks)[number]): Promise<void> {
    this.busy.set(true);
    try {
      const blob = await this.capture();
      if (blob) this.save(blob);

      const url = encodeURIComponent(location.href);
      const text = encodeURIComponent(this.shareTitle());
      window.open(net.build(url, text), '_blank', 'noopener,noreferrer');

      this.message.set(
        blob
          ? 'Imagen guardada y red abierta. Adjunta la imagen manualmente.'
          : 'Red abierta.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  // -------------------------------------------------------------------------

  private async capture(): Promise<Blob | null> {
    try {
      return await toBlob(this.target(), {
        // El fondo del body es transparente: se fija el real para que la
        // imagen sea exactamente lo que se ve.
        backgroundColor: '#05060a',
        cacheBust: true,
        pixelRatio: 2,
      });
    } catch {
      this.message.set('No se ha podido generar la imagen.');
      return null;
    }
  }

  private save(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filename();
    a.click();
    URL.revokeObjectURL(url);
  }
}