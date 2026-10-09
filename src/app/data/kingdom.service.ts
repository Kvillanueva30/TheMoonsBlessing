import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, shareReplay } from 'rxjs';
import { assetUrl } from './asset-url';
import type { KingdomId } from '../core/models/ritual.model';
import type { NatureId } from '../core/models/inner.model';

/**
 * Los seis reinos de Madar, leidos de data/kingdoms/*.json.
 *
 * El archivo es la fuente de verdad. Este servicio no tiene lista de reinos:
 * se deduce de lo que los propios datos declaran.
 */
export interface KingdomData {
  readonly id: KingdomId;
  readonly name: string;
  readonly natures: readonly NatureId[];
  /**
   * El dato declara una transformacion historica real de la diosa sobre TODOS
   * los ciudadanos del reino. Es lo que habilita `transformed` en el resultado.
   * No se deduce de que el reino tenga una sola naturaleza.
   */
  readonly transformedByCurse?: boolean;
  readonly transformationNote?: string;
  readonly founder?: { readonly name: string; readonly title?: string };
  readonly essence?: { readonly en: string; readonly es: string };
  /**
   * Lo que el reino valora, y el precio de cada uno de esos valores.
   *
   * Las sombras van siempre pareadas con su valor de origen: mostrarlas
   * sueltas permitiria leer un reino como el bueno.
   */
  readonly values?: readonly string[];
  readonly shadows?: readonly { readonly from: string; readonly to: string }[];
  /** El aviso que impide que el reino sea el bueno. No es decorativo. */
  readonly guardrail?: string;
}

const KINGDOM_FILES = ['ederian', 'bastia', 'tralan', 'xorian', 'tradia', 'helia'] as const;

@Injectable({ providedIn: 'root' })
export class KingdomService {
  private readonly http = inject(HttpClient);

  private readonly kingdoms$ = forkJoin(
    KINGDOM_FILES.map((id) => this.http.get<KingdomData>(assetUrl(`data/kingdoms/${id}.json`))),
  ).pipe(
    shareReplay(1),
    map((list) => list as readonly KingdomData[]),
  );

  get kingdoms(): Observable<readonly KingdomData[]> {
    return this.kingdoms$;
  }

  get byId(): Observable<ReadonlyMap<KingdomId, KingdomData>> {
    return this.kingdoms$.pipe(map((list) => new Map(list.map((k) => [k.id, k]))));
  }
}