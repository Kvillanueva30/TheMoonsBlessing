import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  viewChild,
} from '@angular/core';

/**
 * Cielo compartido: campo de estrellas, nebulosis y velo.
 *
 * Vive aquí y no en el landing para que la fecha de nacimiento y la revelación
 * de la luna tengan exactamente el mismo cielo. Antes cada página pintaba sus
 * propias estrellas con recursos distintos, y al pasar de una a otra el fondo
 * cambiaba de golpe.
 *
 * El degradado de base del espacio no va aquí: está en styles.scss sobre
 * html, que es lo único que garantiza cubrir hasta el final del viewport.
 */
@Component({
  selector: 'app-sky',
  templateUrl: './sky.html',
  styleUrl: './sky.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkyComponent implements OnDestroy {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private frame = 0;
  private stars: Star[] = [];
  private resizeHandler?: () => void;

  constructor() {
    // viewChild.required solo está disponible tras la creación de la vista, así
    // que el dibujado arranca en el primer ciclo, no en el constructor.
    queueMicrotask(() => this.start());
  }

  private start(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pickColor = (): string => {
      const roll = Math.random();
      // Las mas turquesa: es la luna la que las tiñe. Luego blanco-azules,
      // algunas calidas y muy pocas anaranjadas.
      if (roll < 0.34) return '#4fd6c9';
      if (roll < 0.46) return '#a9ede6';
      if (roll < 0.7) return '#eef2ff';
      if (roll < 0.87) return '#fff6e2';
      if (roll < 0.93) return '#ffe2bd';
      if (roll < 0.98) return '#ffc79a';
      return '#d9ccff';
    };

    const build = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Una estrella cada ~3400 px², con tope para pantallas enormes.
      const count = Math.min(800, Math.round((canvas.width * canvas.height) / 1800));
      this.stars = Array.from({ length: count }, () => {
        // El exponente reparte el peso hacia las pequeñas, como el cielo real.
        const r = Math.random() ** 2.6 * 1.5 + 0.32;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r,
          base: 0.3 + Math.random() * 0.6,
          // Parpadeo de 1,8 a 5 s. Con periodos de 6 a 25 s no se percibía.
          twinkle: 0.0012 + Math.random() * 0.0023,
          // Deriva de 0,6 a 2,4 px/s: se ve sin que parezca que nieva.
          drift: 0.0006 + Math.random() * 0.0018,
          phase: Math.random() * Math.PI * 2,
          color: pickColor(),
          halo: r > 1.05,
        };
      });
    };

    this.resizeHandler = build;
    window.addEventListener('resize', build, { passive: true });
    build();

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of this.stars) {
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
      this.frame = requestAnimationFrame(draw);
    };

    this.frame = requestAnimationFrame(draw);
  }

  ngOnDestroy(): void {
    // Sin esto el bucle sigue corriendo cuando se navega a otra página, y cada
    // visita deja un requestAnimationFrame huérfano pintando sobre un canvas
    // que ya no está en el DOM.
    cancelAnimationFrame(this.frame);
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }
}

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;
  twinkle: number;
  drift: number;
  phase: number;
  color: string;
  halo: boolean;
}
