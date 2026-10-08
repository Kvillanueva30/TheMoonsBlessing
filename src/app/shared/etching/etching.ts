import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Grabados de tema para las preguntas.
 *
 * Mismo lenguaje visual que la luna: SVG, trazo fino, sin relleno, tramado.
 * No fotorealista y no psicodélico.
 *
 * Cada tema tiene su geometría en un viewBox de -50..50, así que el trazo de
 * 0.8 es el mismo peso que en la luna y todo se ve del mismo grosor.
 *
 * Son ESTÁTICOS. No dependen de lo que el visitante responda: son
 * atmosféricos, no informativos. Esa decisión se tomó a propósito para no
 * tener dos imágenes con dos significados distintos en la misma página.
 */
export type EtchingTheme =
  | 'suficiencia'
  | 'identidad'
  | 'poder'
  | 'sacrificio'
  | 'miedo'
  | 'vinculo'
  | 'conflicto'
  | 'pertenencia'
  | 'sabiduria'
  | 'tiempo'
  | 'proyeccion'
  | 'espejo'
  | 'sujeto'
  | 'proposito'
  | 'barca'
  | 'extranjero'
  | 'juicio'
  | 'camara'
  | 'verdad'
  | 'deseo'
  | 'quieres-o-necesitas'
  | 'ventaja';

@Component({
  selector: 'app-etching',
  templateUrl: './etching.html',
  styleUrl: './etching.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EtchingComponent {
  readonly theme = input.required<EtchingTheme>();

  private readonly uid = Math.random().toString(36).slice(2, 9);
  protected readonly hatchId = `etch-hatch-${this.uid}`;

  /** Etiqueta accesible. El grabado no aporta informacion, asi que es decorativo. */
}