import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShareCardData } from './share-card.model';

/**
 * Tarjeta de resultado hecha para compartirse.
 *
 * NO es la pagina: es un bloque de 1200x630 (la medida de Open Graph) que se
 * dibuja en la pagina pero se oculta fuera de la pantalla. ShareService lo
 * captura con html-to-image y produce el PNG.
 *
 * Por que 1200x630 y no el tamano que se ve en pantalla:
 *   - es la medida que usan Twitter, Facebook y WhatsApp como miniatura.
 *   - es un tamano fijo, no relativo: la captura sale siempre igual.
 *
 * Los textos vienen de ShareCardData, que result.ts arma con lo que ya esta
 * calculado. Aqui no hay lore: solo se coloca lo que le llega.
 */
@Component({
  selector: 'app-share-card',
  templateUrl: './share-card.html',
  styleUrl: './share-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareCardComponent {
  readonly data = input.required<ShareCardData>();
}