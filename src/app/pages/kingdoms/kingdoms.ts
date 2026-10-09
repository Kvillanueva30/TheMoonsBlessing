import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
 * Todo cabe en el viewport: titulo, un solo retrato, los puntos y el boton.
 * Con scroll habia que bajar para ver el boton, y bajarse era el gesto que
 * hace la gente cuando ya no le interesa. El carrusel obliga a recorrer los
 * seis staying en el mismo sitio.
 *
 * LA TRASERA ES UN ANZUELO, NO UNA FICHA
 *
 * Solo la esencia: una frase por reino. Ni `values`, ni `shadows`, ni
 * `guardrail`, ni `natureRule`, ni `natures`, ni `transformationNote`, ni
 * `lightDarkness`.
 *
 * Los tres reinos malditos declaran en esos campos que TODOS sus ciudadanos
 * son Cazuts, y Bastia cuenta que Silas era el favorito de la diosa. Eso se
 * revela durante el ritual, no antes. Y una lista de diez valores con sus
 * sombras es una ficha, no un anzuelo: da todo y no deja nada que querer.
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

  /** Desplazamiento en pixeles del dedo o del raton, para el gesto de(arrastrar). */
  private startX: number | null = null;

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

  // ---------------------------------------------------------- arrastre --

  protected onDown(event: PointerEvent): void {
    this.startX = event.clientX;
  }

  /**
   * El umbral evita que un roce con el dedo voltee la card. 48 px es bastante
   * mas que un toque, y bastante menos que un deslizamiento real.
   */
  protected onUp(event: PointerEvent): void {
    if (this.startX === null) return;
    const dx = event.clientX - this.startX;
    this.startX = null;
    if (Math.abs(dx) < 48) return;
    if (dx < 0) this.next();
    else this.prev();
  }

  /** Un id por posicion, para que la silueta referencie su propio tramado. */
  protected uid(i: number): string {
    return `kingdom-hatch-${i}`;
  }
}