import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { assetUrl } from './asset-url';

// Acceso a los textos de resultado en data/results/results.json.
// Las páginas leen de aquí; no hardcodean lore.
export interface NatureText {
  readonly label: string;
  readonly headline: string;
  readonly meaning: string;
  readonly note?: string;
}

export interface ResultsData {
  headline: { en: string; es: string; note?: string };
  reveals: { kingdom: { en: string; es: string; note?: string }; kingdomIntro: string | null };
  natures: Record<string, NatureText>;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ResultsService {
  private readonly http = inject(HttpClient);
  private readonly results$ = this.http
    .get<ResultsData>(assetUrl('data/results/results.json'))
    .pipe(shareReplay(1));

  get results(): Observable<ResultsData> {
    return this.results$;
  }
}
