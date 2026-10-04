import { TestBed } from '@angular/core/testing';
import { MOON_PHASE_IDS, MoonPhaseId, MoonService } from './moon.service';
import moonPhases from '../../../../data/moon/moon-phases.json';

/**
 * Valores de referencia evaluados a las 12:00 UTC del día indicado.
 *
 * Procedencia: los cruces de fase del algoritmo coinciden con los instantes
 * publicados con menos de 2 minutos de diferencia (0,004–0,015°):
 *   luna nueva  2000-01-06 18:14:52  vs  18:14 UTC   ->  0,9 min
 *   luna llena  2000-01-21 04:41:29  vs  04:41 UTC   ->  0,5 min
 *   luna nueva  2024-01-11 11:58:37  vs  11:57 UTC   ->  1,6 min
 *   luna llena  2024-01-25 17:55:41  vs  17:54 UTC   ->  1,7 min
 *
 * El servicio evalúa a las 12:00 UTC, no al instante exacto del evento, así
 * que el ángulo se aparta unos grados. Eso es lo correcto y lo esperado.
 */
const GOLDEN: { date: { year: number; month: number; day: number }; angle: number; id: MoonPhaseId; illumination: number }[] = [
  { date: { year: 2000, month: 1, day: 6 }, angle: 357.17, id: 'new-moon', illumination: 0.0006 },
  { date: { year: 2000, month: 1, day: 21 }, angle: 184.224, id: 'full-moon', illumination: 0.9986 },
  { date: { year: 2024, month: 1, day: 11 }, angle: 0.013, id: 'new-moon', illumination: 0.0 },
  { date: { year: 2024, month: 1, day: 25 }, angle: 177.233, id: 'full-moon', illumination: 0.9994 },
  { date: { year: 1990, month: 1, day: 26 }, angle: 356.239, id: 'new-moon', illumination: 0.0011 },
  { date: { year: 2024, month: 6, day: 15 }, angle: 103.878, id: 'first-quarter', illumination: 0.6199 },
];

const label = ({ year, month, day }: { year: number; month: number; day: number }) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

describe('MoonService', () => {
  let service: MoonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('coincide con la astronomia real', () => {
    for (const row of GOLDEN) {
      it(`situa ${label(row.date)} en ${row.id}`, () => {
        expect(service.getPhaseId(row.date)).toBe(row.id);
      });

      it(`da el angulo correcto en ${label(row.date)}`, () => {
        expect(service.getPhase(row.date).angle).toBeCloseTo(row.angle, 2);
      });

      it(`da la iluminacion correcta en ${label(row.date)}`, () => {
        expect(service.getPhase(row.date).illumination).toBeCloseTo(row.illumination, 3);
      });
    }
  });

  it('reparte las fechas casi por igual entre las ocho fases', () => {
    // Cada fase abarca 45 grados de un mes sinodico de 29,53 dias, o sea un
    // 12,5% de las fechas. Si el reparto se aparta de ahi, el redondeo del
    // intervalo esta mal.
    const counts = new Map<MoonPhaseId, number>();
    let total = 0;
    for (let t = Date.UTC(2000, 0, 1); t < Date.UTC(2010, 0, 1); t += 86400000) {
      const d = new Date(t);
      const id = service.getPhaseId({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
      counts.set(id, (counts.get(id) ?? 0) + 1);
      total++;
    }

    expect(counts.size).toBe(8);
    for (const count of counts.values()) {
      expect(count / total).toBeGreaterThan(0.11);
      expect(count / total).toBeLessThan(0.14);
    }
  });

  it('recorre las fases en orden creciente durante un ciclo', () => {
    const seen: MoonPhaseId[] = [];
    for (let day = 1; day <= 31; day++) {
      const id = service.getPhaseId({ year: 2024, month: 1, day });
      if (seen[seen.length - 1] !== id) seen.push(id);
    }

    expect(seen.length).toBeGreaterThanOrEqual(7);
    expect(seen.indexOf('first-quarter')).toBeGreaterThan(seen.indexOf('waxing-crescent'));
    expect(seen.indexOf('waxing-gibbous')).toBeGreaterThan(seen.indexOf('first-quarter'));
    expect(seen.indexOf('full-moon')).toBeGreaterThan(seen.indexOf('waxing-gibbous'));
  });

  it('devuelve siempre una de las ocho fases entre 1950 y 2050', () => {
    const valid = new Set(service.phases);
    for (let year = 1950; year <= 2050; year++) {
      for (const month of [1, 4, 7, 10]) {
        expect(valid.has(service.getPhaseId({ year, month, day: 15 }))).toBe(true);
      }
    }
  });

  it('mantiene la iluminacion entre 0 y 1 en un ciclo completo', () => {
    for (let day = 1; day <= 30; day++) {
      const { illumination } = service.getPhase({ year: 2024, month: 3, day });
      expect(illumination).toBeGreaterThanOrEqual(0);
      expect(illumination).toBeLessThanOrEqual(1);
    }
  });

  describe('coherencia con los datos de lore', () => {
    it('las ocho fases del algoritmo son las mismas que define moon-phases.json', () => {
      // El algoritmo necesita la lista de fases de forma sincrona, asi que la
      // tiene en su propio dominio. El archivo de datos define las mismas ocho.
      // Si una cambia y la otra no, el motor devolveria fases sin nombre.
      const dataIds = moonPhases.phases.map((phase) => phase.id);
      expect(dataIds).toEqual([...MOON_PHASE_IDS]);
    });

    it('toda fase del algoritmo tiene nombre en español e inglés', () => {
      for (const id of MOON_PHASE_IDS) {
        const record = moonPhases.phases.find((phase) => phase.id === id);
        expect(record, `falta ${id} en moon-phases.json`).toBeTruthy();
        expect(record?.name.es, `falta el nombre es de ${id}`).toBeTruthy();
        expect(record?.name.en, `falta el nombre en de ${id}`).toBeTruthy();
      }
    });

    it('ninguna fase trae texto narrativo inventado', () => {
      // El brief dice que el texto de la luna se definira despues. Mientras
      // tanto deben seguir en null, no rellenados con una guess.
      for (const phase of moonPhases.phases) {
        expect(phase.narrative, `${phase.id} tiene narrativa ya escrita`).toBeNull();
      }
    });
  });

  describe('independencia de la zona horaria', () => {
    it('resuelve el caso que antes fallaba por el offset', () => {
      // La version anterior construia new Date(1990, 0, 26) a medianoche LOCAL
      // y la comparaba contra una referencia en UTC, asi que en offsets
      // negativos caia en la fase anterior. Medido: 374 de 3321 fechas
      // cambiaban de etiqueta solo por el offset horario (11,3%).
      expect(service.getPhaseId({ year: 1990, month: 1, day: 26 })).toBe('new-moon');
    });

    it('es puro: la misma fecha devuelve siempre lo mismo', () => {
      const date = { year: 1990, month: 1, day: 26 };
      expect(service.getPhase(date)).toEqual(service.getPhase({ ...date }));
    });

    it('acepta el mes en base 1, como la experiencia', () => {
      // El componente de fecha usa 1-12. Si el servicio leyera el mes como
      // base 0, el dia 1 de enero caeria en diciembre.
      expect(service.getPhase({ year: 2024, month: 1, day: 1 }).id).toBeTruthy();
      expect(service.getPhase({ year: 2024, month: 12, day: 31 }).id).toBeTruthy();
      // Enero y diciembre tienen que dar fases distintas, no la misma.
      const january = service.getPhase({ year: 2024, month: 1, day: 15 });
      const december = service.getPhase({ year: 2024, month: 12, day: 15 });
      expect(december.angle).not.toBeCloseTo(january.angle, 0);
    });
  });
});
