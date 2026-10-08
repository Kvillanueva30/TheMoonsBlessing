import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoonService } from '../../core/services/moon.service';
import { MoonComponent } from '../../shared/moon/moon';
import { SkyComponent } from '../../shared/sky/sky';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, MoonComponent, SkyComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingPage {
  protected readonly today = inject(MoonService).getPhase(toCalendarDate(new Date()));
}

function toCalendarDate(date: Date): { year: number; month: number; day: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}
