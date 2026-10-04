import { Component, inject, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoonService } from '../../core/services/moon.service';
import { CTA_LABEL, EXPERIENCE_NAME, EXPERIENCE_TAGLINE } from '../../core/config/experience.config';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingPage implements AfterViewInit {
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
  protected readonly todayPhase = inject(MoonService).getPhaseId(toCalendarDate(new Date()));

  ngAfterViewInit(): void {
    this.initStars();
  }

  /**
   * Campo de estrellas.
   *
   * Antes esto eran partículas cálidas que subían, y se leía como polen. Ahora
   * es un campo de estrellas con temperatura de color y halo solo en las más
   * brillantes. Se combina parpadeo con una deriva vertical muy lenta: una
   * estrella real no se mueve, pero del todo quieta la escena parece una
   * imagen fija.
   */
  private initStars(): void {
    const canvas = document.getElementById('stars') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface Star {
      x: number;
      y: number;
      r: number;
      base: number;
      /** Parpadeo, en rad/ms. */
      twinkle: number;
      /** Deriva vertical, en px/ms. */
      drift: number;
      phase: number;
      color: string;
      halo: boolean;
    }

    let stars: Star[] = [];

    const pickColor = (): string => {
      const roll = Math.random();
      // La mayoría blanco-azules, algunas cálidas, muy pocas anaranjadas.
      if (roll < 0.62) return '#eef2ff';
      if (roll < 0.88) return '#fff6e2';
      if (roll < 0.97) return '#ffe2bd';
      return '#ffc79a';
    };

    const build = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Una estrella cada ~3400 px², con tope para pantallas enormes.
      const count = Math.min(460, Math.round((canvas.width * canvas.height) / 3400));
      stars = Array.from({ length: count }, () => {
        // El exponente reparte el peso hacia las pequeñas, como el cielo real.
        const r = Math.random() ** 2.6 * 1.5 + 0.32;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r,
          base: 0.3 + Math.random() * 0.6,
          // Periodo de 1,8 a 5 s. Antes iba de 6 a 25 s y no se perceive.
          twinkle: 0.0012 + Math.random() * 0.0023,
          // 0,6 a 2,4 px/s. Se ve el movimiento sin que parezca que nieva.
          drift: 0.0006 + Math.random() * 0.0018,
          phase: Math.random() * Math.PI * 2,
          color: pickColor(),
          halo: r > 1.05,
        };
      });
    };

    window.addEventListener('resize', build, { passive: true });
    build();

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.y -= s.drift;
        if (s.y < -4) {
          s.y = canvas.height + 4;
          s.x = Math.random() * canvas.width;
        }
        const alpha = s.base * (0.6 + 0.4 * Math.sin(t * s.twinkle + s.phase));
        if (s.halo) {
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
          const hex = Math.round(alpha * 95)
            .toString(16)
            .padStart(2, '0');
          g.addColorStop(0, `${s.color}${hex}`);
          g.addColorStop(1, `${s.color}00`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  }
}

/** Fecha de calendario en base 1 para el mes, como espera MoonService. */
function toCalendarDate(date: Date): { year: number; month: number; day: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}
