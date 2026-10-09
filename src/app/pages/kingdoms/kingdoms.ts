import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { KingdomService, type KingdomData } from '../../data/kingdom.service';
import { SkyComponent } from '../../shared/sky/sky';

/**
 * Los seis reinos, antes de la fecha de nacimiento. Un carrusel.
 *
 * NO es una pantalla de eleccion: el visitante no elige reino aqui, el motor
 * lo decide. El boton dice "Continuar" y no "elige". Esta pagina no toca el
 * motor ni lee reglas.
 *
 * LA PANTALLA NO HACE SCROLL VERTICAL
 *
 * Todo cabe en el viewport: titulo, un retrato, los puntos y el boton. Con
 * scroll habia que bajar para ver el boton, y bajarse es justo el gesto que
 * hace la gente cuando ya no le interesa. El carrusel obliga a recorrer los
 * seis staying en el mismo sitio.
 *
 * LOS RETRATOS
 *
 * Cada reino tiene dos: el rey de la guerra, en la cara frontal, y el rey
 * joven cuando fue nombrado por primera vez, en la trasera. El giro muestra
 * el cambio.
 *
 * Los archivos van en public/retratos/ y se nombran con el ID DEL REINO, no
 * con el nombre del fundador: el de Bastia se llama `bastia-guerra`, aunque
 * su fundador sea Silas. Con id: bastia, ederian, tralan, xorian, tradia,
 * helia. No hay archivo todavia, asi que se comprueban las extensiones en
 * orden y, si ninguna existe, se muestra el hueco con el nombre que falta.
 *
 * MIENTRAS FALTEN, NO SE INVENTA NADA: el hueco dice el nombre exacto del
 * archivo y el tamano, para que se vea que falta y cual.
 */
@Component({
  selector: 'app-kingdoms',
  imports: [RouterLink, SkyComponent],
  templateUrl: './kingdoms.html',
  styleUrl: './kingdoms.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KingdomsPage {
  protected readonly kingdoms = toSignal(inject(KingdomService).kingdoms, {
    initialValue: [] as readonly KingdomData[],
  });

  /** Reino que se esta viendo. El carrusel no tiene estado propio: es un indice. */
  protected readonly index = signal(0);
  protected readonly total = computed(() => this.kingdoms().length);
  protected readonly current = computed(() => this.kingdoms()[this.index()] ?? null);

  /** En tactil, que la card visible este volteada. En escritorio no se usa. */
  protected readonly flipped = signal(false);

  /**
   * En escritorio el giro lo hace el CSS con `:hover`, porque el cursor ya
   * esta ahi y no necesita un estado. En tactil no hay hover, asi que ahi el
   * unico gesto disponible es el toque, y hace falta estado.
   */
  private readonly canHover =
    typeof window === 'undefined' || window.matchMedia('(hover: hover)').matches;

  /** Desplazamiento en pixeles del dedo o del raton, para el gesto de arrastrar. */
  private startX: number | null = null;

  // --------------------------------------------------------- retratos --

  /**
   * Se comprueba ANTES de renderizar, y no reintentando desde la plantilla.
   *
   * La primera version pedia .jpg, y al fallar ponia .png en el mismo
   * elemento <img>. No funciona: cambiar el src de una imagen que esta
   * cargando aborta la peticion anterior, y el aborto dispara otro `error`.
   * Medido, asi los cuatro intentos se consumian en cascada sin llegar a
   * probar nada: silas-guerra.jpeg servia con 200 y la card seguia
   * mostrando el hueco.
   *
   * Aqui no hay reintento en el DOM. Se prueba con una imagen suelta, que no
   * esta en la pagina, y solo se pinta cuando se sabe que carga.
   */
  private static readonly EXT = ['.jpg', '.jpeg', '.png', '.webp'];

  /** Retratos que existen, por clave. */
  private readonly resueltos = signal<Readonly<Record<string, string>>>({});

  /** Claves cuya comprobacion TERMINO, exista el archivo o no. */
  private readonly revisados = signal<ReadonlySet<string>>(new Set<string>());

  constructor() {
    effect(() => {
      const ks = this.kingdoms();
      if (ks.length > 0) this.buscar(ks);
    });
  }

  /**
   * Cada retrato se resuelve por separado y escribe en su propia señal.
   *
   * No se usa un Promise.all para las doce. Medido: si UNA sola de las
   * peticiones se queda colgada, Promise.all no resuelve nunca y la pantalla
   * se queda con los doce huecos para siempre, sin que se note por que. En
   * carga limpia siempre pasaba; llamada a mano, mas tarde, no. Por eso los
   * doce van sueltas.
   */
  private buscar(kingdoms: readonly KingdomData[]): void {
    for (const k of kingdoms) {
      for (const momento of ['guerra', 'joven'] as const) {
        this.resolver(`${k.id}-${momento}`);
      }
    }
  }

  private resolver(clave: string): void {
    void this.localizar(clave).then((url) => {
      if (url) this.resueltos.update((m) => ({ ...m, [clave]: url }));
      this.revisados.update((s) => new Set(s).add(clave));
    });
  }

  private async localizar(clave: string): Promise<string | null> {
    for (const ext of KingdomsPage.EXT) {
      const url = `retratos/${clave}${ext}`;
      if (await carga(url)) return url;
    }
    return null;
  }

  /** URL del retrato, o null si no se ha encontrado. La plantilla no reintenta. */
  protected retrato(id: string, momento: 'guerra' | 'joven'): string | null {
    return this.resueltos()[`${id}-${momento}`] ?? null;
  }

  /**
   * El hueco aparece solo cuando la comprobacion ya termino. Mientras esta
   * en curso se deja el marco vacio, porque decir "falta" antes de saber si
   * falta es mentir.
   */
  protected falta(id: string, momento: 'guerra' | 'joven'): boolean {
    const clave = `${id}-${momento}`;
    return this.revisados().has(clave) && this.resueltos()[clave] === undefined;
  }

  /**
   * Nombre exacto que hay que dejar en public/retratos/ para ese hueco. Se
   * ensena para que se vea que falta cual, no solo que algo falta.
   */
  protected nombreArchivo(id: string, momento: 'guerra' | 'joven'): string {
    return id + '-' + momento + '.jpeg';
  }

  // -------------------------------------------------------- carrusel --

  protected next(): void {
    this.goTo(this.index() + 1);
  }

  protected prev(): void {
    this.goTo(this.index() - 1);
  }

  /** Da la vuelta al final, no se frena: seis reinos son un circulo. */
  protected goTo(i: number): void {
    const n = this.total();
    if (n === 0) return;
    this.index.set(((i % n) + n) % n);
    // Al cambiar de reino la card nueva viene de frente.
    this.flipped.set(false);
  }

  protected isCurrent(i: number): boolean {
    return i === this.index();
  }

  protected toggle(): void {
    if (this.canHover) return;
    this.flipped.update((v) => !v);
  }

  // -------------------------------------------------------- arrastre --

  protected onDown(event: PointerEvent): void {
    this.startX = event.clientX;
  }

  /** Umbral en pixeles: distingue el desplazamiento real de un roce con el dedo. */
  protected onUp(event: PointerEvent): void {
    if (this.startX === null) return;
    const dx = event.clientX - this.startX;
    this.startX = null;
    if (Math.abs(dx) < 48) return;
    if (dx < 0) this.next();
    else this.prev();
  }
}

/**
 * Comprueba si una URL es una imagen valida sin meterla en la pagina.
 *
 * Se usa una imagen suelta a proposito: si estuviera en el DOM, cambiarle el
 * src abortaria la carga anterior y dispararia un `error` de mas, que es
 * justamente lo que hacia fallar la primera version.
 *
 * El limite de tiempo no es decorativo. Sin el, una peticion que se queda
 * colgada deja el retrato en "buscando" para siempre; con el, se resuelve
 * como ausente y la pantalla sigue arrancando.
 */
function carga(url: string): Promise<boolean> {
  return new Promise((resuelto) => {
    let resueltoYa = false;
    const fin = (valor: boolean) => {
      if (resueltoYa) return;
      resueltoYa = true;
      clearTimeout(aviso);
      resuelto(valor);
    };
    const aviso = setTimeout(() => fin(false), 8000);
    const img = new Image();
    img.onload = () => fin(img.naturalWidth > 0);
    img.onerror = () => fin(false);
    img.src = url;
  });
}