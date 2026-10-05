import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoonService } from '../../core/services/moon.service';
import { MoonComponent } from '../../shared/moon/moon';
import { SkyComponent } from '../../shared/sky/sky';
import { CTA_LABEL, EXPERIENCE_NAME, EXPERIENCE_TAGLINE } from '../../core/config/experience.config';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, MoonComponent, SkyComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingPage {
  protected readonly name = EXPERIENCE_NAME;
  protected readonly tagline = EXPERIENCE_TAGLINE;
  protected readonly cta = CTA_LABEL;

  /**
   * Fase lunar del día actual, para que la luna del landing cambie sola.
   *
   * Se construye con las partes de la fecha local, que es lo que el visitante
   * quiere ver: la luna de hoy. MoonService evalúa a 12:00 UTC de ese día, así
   * que el resultado no depende de su zona horaria.
   */
  protected readonly today = inject(MoonService).getPhase(toCalendarDate(new Date()));
}

/** Fecha de calendario en base 1 para el mes, como espera MoonService. */
function toCalendarDate(date: Date): { year: number; month: number; day: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}
