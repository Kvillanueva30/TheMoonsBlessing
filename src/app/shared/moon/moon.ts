import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { MoonPhaseResult } from '../../core/services/moon.service';

/**
 * Luna realista en SVG.
 *
 * Está en SVG y no en CSS por dos razones concretas:
 *
 * 1. Un cráter necesita borde iluminado y fondo en sombra, con la luz viniendo
 *    de un lado. Con `radial-gradient` solo se puede pintar un disco plano, y
 *    una luna hecha de discos planos se lee como un círculo con círculos
 *    encima, que es exactamente lo que pasaba.
 *
 * 2. El terminador de verdad es una elipse cuyo semieje menor vale
 *    R·cos(ángulo de fase). En CSS no hay forma de dibujar esa elipse, así que
 *    la luna quedaba partida en dos mitades exactas. Aquí el path se calcula
 *    con la iluminación real que devuelve MoonService.
 *
 * Se dibuja al revés a como se lee: primero el disco entero con el aspecto de
 * luna no iluminada (brillo terrestre) y encima la zona iluminada recortada
 * con un clipPath. Así el terminador sale solo y los cráteres de la cara
 * oscura quedantenues en vez de ausentes.
 */
@Component({
  selector: 'app-moon',
  templateUrl: './moon.html',
  styleUrl: './moon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoonComponent {
  readonly phase = input.required<MoonPhaseResult>();

  /** Ids únicos, por si someday hay dos lunas en la misma página. */
  private readonly uid = Math.random().toString(36).slice(2, 9);
  protected readonly clipId = `moon-lit-${this.uid}`;
  protected readonly darkMaskId = `moon-dark-${this.uid}`;
  protected readonly hatchId = `moon-hatch-${this.uid}`;

  /**
   * Menguante cuando el ángulo supera los 180°. Se voltea horizontalmente en
   * lugar de tener dos juegos de paths: así las fases crecientes y menguantes
   * comparten geometría y no pueden desincronizarse.
   */
  protected readonly mirror = computed(() => (this.phase().angle > 180 ? 'scale(-1, 1)' : null));

  /**
   * Contorno de la zona iluminada, en un viewBox de -50..50.
   *
   * q = 2·k − 1 va de −1 a 1: es cuánto se sale del medio. Con q = 0 el
   * terminador cae en el centro y es recto, que es el cuarto exacto. Con
   * q = ±1 el arco se abre hasta ser el otro semicírculo y la luna queda
   * llena o nueva. El signo de q decide hacia dónde abomba el terminador, y
   * con él el flag de barrido del arco.
   */
  protected readonly litPath = computed(() => {
    const R = 50;
    const q = 2 * this.phase().illumination - 1;
    const rx = Math.abs(q) * R;
    // q >= 0: el terminador abomba hacia la izquierda, arco horario.
    // q < 0: abomba hacia la derecha, arco antihorario.
    const sweep = q >= 0 ? 1 : 0;
    return `M 0 ${-R} A ${R} ${R} 0 0 1 0 ${R} A ${rx.toFixed(3)} ${R} 0 0 ${sweep} 0 ${-R} Z`;
  });
}
