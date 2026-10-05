import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MoonPhaseResult, MoonService } from '../../core/services/moon.service';
import { MoonPhasesService } from '../../data/moon-phases.service';
import { MoonComponent } from '../../shared/moon/moon';
import { SkyComponent } from '../../shared/sky/sky';

@Component({
  selector: 'app-moon-reveal',
  imports: [RouterLink, MoonComponent, SkyComponent],
  templateUrl: './moon-reveal.html',
  styleUrl: './moon-reveal.scss',
})
export class MoonRevealPage {
  private readonly route = inject(ActivatedRoute);
  private readonly moon = inject(MoonService);
  private readonly moonPhases = inject(MoonPhasesService);

  phase: MoonPhaseResult | null = null;

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const year = Number(params.get('y'));
      const month = Number(params.get('m'));
      const day = Number(params.get('d'));
      // Se pasan las partes del calendario tal cual, sin construir un Date:
      // el servicio evalúa a 12:00 UTC y así el resultado no depende de la
      // zona horaria de quien visita.
      if (year && month && day) {
        this.phase = this.moon.getPhase({ year, month, day });
      }
    });
  }

  get phaseId(): MoonPhaseResult['id'] | null {
    return this.phase?.id ?? null;
  }

  /** El nombre de la fase sale del archivo de datos, no del componente. */
  get phaseLabel(): string | null {
    return this.phaseId ? this.moonPhases.labelFor(this.phaseId) : null;
  }
}
