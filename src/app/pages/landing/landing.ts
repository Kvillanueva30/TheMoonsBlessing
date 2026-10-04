import { Component, inject, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { ResultsService } from '../../data/results.service';
import { MoonService } from '../../core/services/moon.service';
import { EXPERIENCE_NAME } from '../../core/config/experience.config';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingPage implements AfterViewInit {
  protected readonly results = inject(ResultsService).results;
  protected readonly name = EXPERIENCE_NAME;

  /**
   * Fase lunar del día actual, para que la luna del landing cambie sola.
   *
   * Se construye con las partes de la fecha local, que es lo que el visitante
   * quiere ver: la luna de hoy. MoonService evalúa a 12:00 UTC de ese día, así
   * que el resultado no depende de su zona horaria.
   */
  protected readonly todayPhase = inject(MoonService).getPhaseId(toCalendarDate(new Date()));

  ngAfterViewInit(): void {
    this.initMotes();
  }

  private initMotes(): void {
    // Partículas/estrellas suaves, estilo Between adaptado.
    const canvas = document.getElementById('motes') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    const N = Math.min(90, Math.round((window.innerWidth * window.innerHeight) / 26000));
    const motes = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.4,
      a: Math.random(),
      s: Math.random() * 0.22 + 0.05,
      d: Math.random() * Math.PI * 2,
      golden: Math.random() < 0.24,
    }));

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const m of motes) {
        m.y -= m.s;
        m.d += 0.008;
        if (m.y < -6) {
          m.y = canvas.height + 6;
          m.x = Math.random() * canvas.width;
        }
        const tw = 0.32 + 0.68 * (0.5 + 0.5 * Math.sin(t * 0.0011 + m.d * 2.4));
        const x = m.x + Math.sin(m.d) * 15;
        const al = m.a * tw;
        const color = m.golden ? '201,146,47' : '240,217,168';
        const g = ctx.createRadialGradient(x, m.y, 0, x, m.y, m.r * 7);
        g.addColorStop(0, `rgba(${color},${al * 0.5})`);
        g.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, m.y, m.r * 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,252,244,${al})`;
        ctx.beginPath();
        ctx.arc(x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  }
}

/** Fecha de calendario en base 1 para el mes, como espera MoonService. */
function toCalendarDate(date: Date): { year: number; month: number; day: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}
