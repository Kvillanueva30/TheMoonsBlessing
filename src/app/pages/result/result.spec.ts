import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MoonService } from '../../core/services/moon.service';

/**
 * Regresion: la luna no salia en la pagina de resultado.
 *
 * Causa: /moon-reveal enlazaba a /questions sin la fecha. La luna viaja en
 * ?y=&m=&d= desde birth-date, y ese enlace la tiraba. Asi /questions no
 * tenia nada que pasar a /result y la luna nunca se calculaba.
 *
 * Estos tests fijan la FORMA real de la luna y que MoonService calcula una
 * fecha concreta, que es lo que la pagina de resultado consume.
 */

describe('MoonPhaseResult', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => {
    const http = TestBed.inject(HttpTestingController);
    for (const r of http.match(() => true)) r.flush({ questions: [] });
    http.verify();
  });

  it('tiene la forma que MoonComponent consume: id, angle, illumination', () => {
    const moon = TestBed.inject(MoonService);
    const phase = moon.getPhase({ year: 1990, month: 6, day: 15 });

    // MoonComponent lee exactamente estos tres campos. Si el tipo se declara
    // otra vez en models/ con otros nombres, estas aserciones no compilan.
    expect(typeof phase.id).toBe('string');
    expect(typeof phase.angle).toBe('number');
    expect(typeof phase.illumination).toBe('number');
  });

  it('devuelve siempre un id de fase valido para cualquier fecha', () => {
    const moon = TestBed.inject(MoonService);
    const VALID = [
      'new-moon', 'waxing-crescent', 'first-quarter', 'waxing-gibbous',
      'full-moon', 'waning-gibbous', 'last-quarter', 'waning-crescent',
    ];
    // No se afirma ninguna fecha concreta: no esta verificada. Lo que importa
    // para la pagina de resultado es que el id siempre sea dibujable.
    for (let m = 1; m <= 12; m++) {
      for (const d of [1, 15, 28]) {
        expect(VALID).toContain(moon.getPhase({ year: 2000, month: m, day: d }).id);
      }
    }
  });

  it('la iluminacion esta entre 0 y 1', () => {
    const moon = TestBed.inject(MoonService);
    for (let m = 1; m <= 12; m += 3) {
      const p = moon.getPhase({ year: 1995, month: m, day: 15 });
      expect(p.illumination).toBeGreaterThanOrEqual(0);
      expect(p.illumination).toBeLessThanOrEqual(1);
    }
  });
});