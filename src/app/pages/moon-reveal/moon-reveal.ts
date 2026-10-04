import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MoonService, MoonPhaseId } from '../../core/services/moon.service';

@Component({
  selector: 'app-moon-reveal',
  imports: [RouterLink],
  templateUrl: './moon-reveal.html',
  styleUrl: './moon-reveal.scss',
})
export class MoonRevealPage {
  private readonly route = inject(ActivatedRoute);
  private readonly moon = inject(MoonService);

  phase: MoonPhaseId | null = null;

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const y = Number(params.get('y'));
      const m = Number(params.get('m'));
      const d = Number(params.get('d'));
      if (y && m && d) {
        this.phase = this.moon.getPhase(new Date(y, m - 1, d));
      }
    });
  }

  get phaseLabel(): string {
    switch (this.phase) {
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
