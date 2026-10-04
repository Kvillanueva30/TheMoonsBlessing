import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MoonPhaseResult, MoonService } from '../../core/services/moon.service';

@Component({
  selector: 'app-moon-reveal',
  imports: [RouterLink],
  templateUrl: './moon-reveal.html',
  styleUrl: './moon-reveal.scss',
})
export class MoonRevealPage {
  private readonly route = inject(ActivatedRoute);
  private readonly moon = inject(MoonService);

  phase: MoonPhaseResult | null = null;

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const year = Number(params.get('y'));
      const month = Number(params.get('m'));
      const day = Number(params.get('d'));
      // Se pasan las partes del calendario tal cual, sin construir un Date:
      // el servicio evalua a 12:00 UTC y asi el resultado no depende de la
      // zona horaria de quien visita.
      if (year && month && day) {
        this.phase = this.moon.getPhase({ year, month, day });
      }
    });
  }

  get phaseId(): MoonPhaseResult['id'] | null {
    return this.phase?.id ?? null;
  }

  get phaseLabel(): string {
    switch (this.phaseId) {
      case 'new-moon':
        return 'Luna Nueva';
      case 'waxing-crescent':
        return 'Luna Creciente';
      case 'first-quarter':
        return 'Cuarto Creciente';
      case 'waxing-gibbous':
        return 'Gibosa Creciente';
      case 'full-moon':
        return 'Luna Llena';
      case 'waning-gibbous':
        return 'Gibosa Menguante';
      case 'last-quarter':
        return 'Cuarto Menguante';
      case 'waning-crescent':
        return 'Luna Creciente Menguante';
      default:
        return '???';
    }
  }
}
