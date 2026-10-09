import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { KingdomService, type KingdomData } from '../../data/kingdom.service';
import { SkyComponent } from '../../shared/sky/sky';

/**
 * Los seis reinos, antes de la fecha de nacimiento.
 *
 * No es una pantalla de eleccion: el visitante NO elige reino aqui, y el
 * boton no dice "elige". Es una pantalla de contexto, y por eso las seis
 * cards estan siempre a la vista, sin estadosselected ni llamada al motor.
 *
 * QUE SE VE Y QUE NO
 *
 * Cara frontal: la silueta del fundador y su nombre. No hay retrato porque
 * no existe arte de los fundadores en el proyecto, y AGENTS.md deja la
 * imagen por IA fuera de alcance. La silueta es un hueco honesto: cuando
 * llegue el arte, se cambia el fondo de la cara frontal y no el resto.
 *
 * Cara trasera: essence, values, shadows y guardrail. Solo eso.
 *
 * NO se muestran `natureRule`, `natures`, `transformationNote` ni
 * `lightDarkness`. Los tres reinos malditos declaran ahi que TODOS sus
 * ciudadanos son Cazuts, y Bastia cuenta que Silas era el favorito de la
 * diosa. Enseñar eso aqui regalaria, antes del ritual, la revelacion que
 * despues descubre el visitante, y un spoiler de una generacion entera.
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

  /** indice de la card volteada a mano, o null si ninguna. */
  protected readonly flipped = signal<number | null>(null);

  /**
   * En escritorio el giro lo hace el CSS con `:hover`, porque el cursor ya
   * esta ahi. En tactil no hay hover, asi que el unico gesto disponible es el
   * toque: ahi si hace falta estado, y por eso existe `flipped`.
   *
   * Se comprueba con matchMedia y no con `hover: hover` en el SCSS porque la
   * clase la decide Angular, no el navegador.
   */
  private readonly canHover =
    typeof window === 'undefined' || window.matchMedia('(hover: hover)').matches;

  protected toggle(i: number): void {
    if (this.canHover) return;
    this.flipped.update((actual) => (actual === i ? null : i));
  }

  protected isFlipped(i: number): boolean {
    return this.flipped() === i;
  }

  /** Un id por card, para que la silueta pueda referenciar su propio tramado. */
  protected uid(i: number): string {
    return `kingdom-hatch-${i}`;
  }
}