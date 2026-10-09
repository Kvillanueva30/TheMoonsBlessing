import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ResultsService } from '../../data/results.service';
import { SkyComponent } from '../../shared/sky/sky';
import type { NatureId } from '../../core/models/inner.model';
import { assetUrl } from '../../data/asset-url';

/**
 * LAS TRES NATURALEZAS. Un carrusel.
 *
 * NO es una pantalla de eleccion: el visitante no se elige su naturaleza. La
 * calcula el motor, despues de las respuestas. Aqui solo se le enseña que
 * existen las tres y lo que significa cada una. Por eso el boton dice
 * "Continuar" y no "elige".
 *
 * REEMPLAZA A LA PANTALLA DE LOS SEIS REINOS en el flujo. El componente de
 * reinos sigue en el codigo, sin borrar, pero ya no se muestra.
 *
 * LAS TRES A LA VEZ, EN HORIZONTAL
 *
 * A diferencia de los reinos, aqui las tres se ven juntas. Se puede, porque
 * son tres y caben; los seis reinos no cabian y por eso iban de uno en uno.
 * Cada tarjeta se voltea sola: pasar el cursor o tocarla.
 *
 * LA LUZ NO ES BONDAD
 *
 * Este archivo no dice que ninguna naturaleza sea buena ni mala, y no puede:
 * el canon lo prohibe de forma explicita (lore-rules.json, principle: "la
 * naturaleza NO es moralidad. Cazut no significa malo. Manskling y Diubak no
 * significan buenos"). El orden de las tres es el del dato, no una jerarquia.
 *
 * LOS TEXTOS VIENEN DEL DATO
 *
 * Ni una palabra de naturalezas esta escrita aqui. El nombre, el significado
 * y el origen se leen de data/results/results.json. Si el dato no lo trae, no
 * se inventa: se muestra el hueco.
 */
@Component({
  selector: 'app-natures',
  imports: [RouterLink, SkyComponent],
  templateUrl: './natures.html',
  styleUrl: './natures.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NaturesPage {
  private readonly results = inject(ResultsService);

  /** Los textos de results.json. Llegan por HTTP: no existen en el constructor. */
  private readonly data = toSignal(this.results.results, { initialValue: null });

  /**
   * Las tres, en el orden que declara el dato.
   *
   * El orden es el de results.json: manskling, diubak, cazut. No es un
   * progreso ni una jerarquia: es el orden en que el canon explica el
   * proceso, de quien no ha sido transformado a quien lo ha sido por maldicion.
   */
  readonly naturalezas = computed<readonly NatureView[]>(() => {
    const naturalezas = this.data()?.natures ?? {};
    return (Object.keys(naturalezas) as NatureId[])
      .filter((id) => !!naturalezas[id])
      .map((id) => {
        const n = naturalezas[id];
        return {
          id,
          label: n.label,
          headline: n.headline,
          meaning: n.meaning,
          origen: this.origenDe(id),
          archivo: `naturaleza/${id}.jpeg`,
        };
      });
  });

  readonly total = computed(() => this.naturalezas().length);

  /**
   * Los origenes que el dato declara para ESTA naturaleza.
   *
   * origins.json declara dos por naturaleza: como se puede haber llegado a
   * ella. No se elige un origen aqui: se enseñan los que el canon permite para
   * esa naturaleza. El visitante no ve puntuaciones ni decide nada.
   */
  private origenDe(id: NatureId): readonly OrigenView[] {
    const origins = this.data()?.['origins'] ?? {};
    return Object.values(origins)
      .filter((o) => o.appliesTo.includes(id))
      .map((o) => ({ id: o.id, label: o.label, rule: o.rule }));
  }

  /**
   * Comprobacion de archivo, igual que en la pantalla de reinos.
   *
   * La imagen vive en public/naturaleza/ y se llama como su id. Se prueba
   * fuera del DOM y solo se pinta cuando se sabe que carga: si esta en la
   * pagina, cambiar el src aborta la peticion anterior y dispara otro error.
   */
  private readonly resueltos = signal<Readonly<Record<string, string>>>({});
  private readonly revisados = signal<ReadonlySet<string>>(new Set());

  /**
   * Se buscan cuando YA HAY naturalezas, no en el constructor.
   *
   * El texto llega por HTTP: en el constructor el array esta vacio, y
   * buscar ahi no encuentra nada. Con un effect, en cuanto la senal tiene
   * las tres, se comprueban los tres archivos. Es lo mismo que hace la
   * pantalla de reinos, y por el mismo motivo.
   */
  constructor() {
    effect(() => {
      const ns = this.naturalezas();
      if (ns.length === 0) return;
      this.buscar(ns);
    });
  }

  private buscar(naturalezas: readonly NatureView[]): void {
    for (const n of naturalezas) {
      const id = n.id;
      if (this.revisados().has(id)) continue;
      void this.localizar(id).then((url) => {
        if (url) this.resueltos.update((m) => ({ ...m, [id]: url }));
        this.revisados.update((s) => new Set(s).add(id));
      });
    }
  }

  private static readonly EXT = ['.jpg', '.jpeg', '.png', '.webp'];

  private async localizar(id: NatureId): Promise<string | null> {
    for (const ext of NaturesPage.EXT) {
      const url = assetUrl(`naturaleza/${id}${ext}`);
      if (await carga(url)) return url;
    }
    return null;
  }

  /** URL de la imagen, o null si aun no se sabe. */
  retrato(id: NatureId): string | null {
    return this.resueltos()[id] ?? null;
  }

  /** El hueco aparece solo cuando la comprobacion TERMINO. */
  falta(id: NatureId): boolean {
    return this.revisados().has(id) && this.resueltos()[id] === undefined;
  }

  /** Nombre exacto que hay que dejar en public/naturaleza/. */
  nombreArchivo(id: NatureId): string {
    return id + '.jpeg';
  }

  /**
   * En tactil el giro lo manda el componente; en escritorio, el hover de mas
   * abajo. Igual que en los reinos: no hay hover en un movil, asi que ahi el
   * unico gesto disponible es el toque y hace falta estado.
   */
  private readonly volteadas = signal<ReadonlySet<NatureId>>(new Set());
  private readonly canHover =
    typeof window === 'undefined' || window.matchMedia('(hover: hover)').matches;

  isVolteada(id: NatureId): boolean {
    return this.volteadas().has(id);
  }

  voltear(id: NatureId): void {
    if (this.canHover) return;
    this.volteadas.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ------------------------------------------------------- carrusel ----

  /**
   * Indice de la carta visible. SOLO se usa en vertical.
   *
   * En escritorio las tres se ven a la vez y esto no se lee. En vertical no
   * caben: medido, a 800 de ancho el texto de la trasera llegaba a 9.3 px, y
   * en un movil la card baja a unos 110 px de ancho. Con el minimo de letra
   * arreglado, la unica forma de que el texto quepa y se lea es una carta a
   * la vez, como en la pantalla de los reinos.
   */
  readonly index = signal(0);

  /**
   * Si el navegador es estrecho y las tres van de una en una.
   *
   * Se decide en el constructor y no se recalcula: el breakpoint son 34rem,
   * y un giro de pantalla a mitad de lectura cambiaria las reglas de foco y
   * aria a la vez que se esta leyendo.
   */
  readonly esCarrusel =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 34rem)').matches;

  next(): void {
    const n = this.total();
    if (n === 0) return;
    this.index.update((i) => (i + 1) % n);
  }

  prev(): void {
    const n = this.total();
    if (n === 0) return;
    this.index.update((i) => (i - 1 + n) % n);
  }

  isCurrent(i: number): boolean {
    return this.index() === i;
  }

  goTo(i: number): void {
    this.index.set(i);
  }

  /**
   * Deslizar. Mismo umbral que los reinos (48 px): por debajo es un roce y no
   * debe cambiar la carta, que es lo que mas molesta cuando se intenta leer.
   */
  private startX: number | null = null;

  onDown(event: PointerEvent): void {
    this.startX = event.clientX;
  }

  onUp(event: PointerEvent): void {
    if (this.startX === null) return;
    const dx = event.clientX - this.startX;
    this.startX = null;
    if (Math.abs(dx) < 48) return;
    if (dx < 0) this.next();
    else this.prev();
  }
}

/** Lo que la plantilla necesita de una naturaleza. Solo forma, ninguna regla. */
interface NatureView {
  readonly id: NatureId;
  readonly label: string;
  readonly headline: string;
  readonly meaning: string;
  readonly origen: readonly OrigenView[];
  readonly archivo: string;
}

/** Un origen declarado por el dato, con la naturaleza a la que aplica. */
interface OrigenView {
  readonly id: string;
  readonly label: string;
  readonly rule: string;
}

/**
 * Comprueba si una URL es una imagen valida sin meterla en la pagina.
 *
 * El limite de tiempo no es decorativo: sin el, una peticion que se queda
 * colgada deja el retrato en "buscando" para siempre.
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