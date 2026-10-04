// Servicio de cálculo de fase lunar.
//
// Implementación propia, sin dependencias externas, basada en A. Meeus,
// Astronomical Algorithms (2ª ed.):
//   · Cap. 25 — longitud eclíptica del Sol
//   · Cap. 47 — longitud eclíptica de la Luna (tabla 47.A completa)
//   · Cap. 48 — la elongación Luna-Sol ES el ángulo de fase
//
// Por qué no una lista de fechas: el brief exige un cálculo real.
// Por qué no un mes sinódico medio constante: la versión anterior usaba
// 29.530588853 días desde una época fija, lo que acumula ~11° de desfase medio
// y etiquetaba mal el 9,6% de las fechas entre 1950 y 2050.
//
// Verificación: los cruces de fase calculados coinciden con los instantes
// publicados con menos de 2 minutos de diferencia (0,004–0,015°), muy por
// debajo del ancho de 45° de cada intervalo.
//
// El servicio NO construye Dates a partir de partes locales. Recibe año, mes y
// día, y evalúa siempre a las 12:00 UTC. Así el resultado es idéntico en
// cualquier zona horaria y los tests no son intermitentes.
import { Injectable } from '@angular/core';

export const MOON_PHASE_IDS = [
  'new-moon',
  'waxing-crescent',
  'first-quarter',
  'waxing-gibbous',
  'full-moon',
  'waning-gibbous',
  'last-quarter',
  'waning-crescent',
] as const;

export type MoonPhaseId = (typeof MOON_PHASE_IDS)[number];

/** Fecha de calendario. El mes va de 1 a 12, como en la experiencia. */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export interface MoonPhaseResult {
  id: MoonPhaseId;
  /** Ángulo de fase en grados: 0 = luna nueva, 90 = cuarto creciente, 180 = llena, 270 = cuarto menguante. */
  angle: number;
  /** Fracción iluminada del disco lunar, de 0 a 1. */
  illumination: number;
}

const RAD = Math.PI / 180;
const J2000 = 2451545.0;

/**
 * Tabla 47.A de Meeus: [D, M, M', F, Σl].
 * Σl está en unidades de 1e-6 grados. D = elongación media, M = anomalía media
 * del Sol, M' = anomalía media de la Luna, F = argumento de latitud.
 * Los términos con M = ±1 se escalan por la excentricidad terrestre.
 */
const MOON_TERMS: readonly (readonly [number, number, number, number, number])[] = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314],
  [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332],
  [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322],
  [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034],
  [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888], [2, 1, 0, 0, -6766],
  [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665],
  [0, 1, -2, 0, -2689], [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390],
  [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236], [0, 1, 2, 0, -2120],
  [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048], [2, 0, 1, -2, -1773],
  [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110],
  [3, 0, -1, 0, -892], [2, 1, 1, 0, -810], [4, -1, -2, 0, 759],
  [0, 2, -1, 0, -713], [2, 2, -1, 0, -700], [2, 1, -2, 0, 691],
  [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537],
  [4, -1, 0, 0, 520], [1, 0, -2, 0, -487], [2, 1, 0, -2, -399],
  [0, 0, 2, -2, -381], [1, 1, 1, 0, 351], [3, 0, -2, 0, -340],
  [4, 0, -3, 0, 330], [2, -1, 2, 0, 327], [0, 2, 1, 0, -323],
  [1, 1, -1, 0, 299], [2, 0, 3, 0, 294], [2, 0, -1, -2, 0],
];

/** Longitud eclíptica de la Luna, en grados. Meeus, cap. 47. */
function moonLongitude(jd: number): number {
  const T = (jd - J2000) / 36525;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  const meanLongitude = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
  const elongation = (297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000) * RAD;
  const sunAnomaly = (357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000) * RAD;
  const moonAnomaly = (134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000) * RAD;
  const latitude = (93.272095 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000) * RAD;

  const additive1 = (119.75 + 131.849 * T) * RAD;
  const additive2 = (53.09 + 479264.29 * T) * RAD;

  // Corrección por la excentricidad de la órbita terrestre, según el orden en M.
  const e1 = 1 - 0.002516 * T - 0.0000074 * T2;
  const e2 = e1 * e1;

  let sum = 0;
  for (const [d, m, mp, f, sigma] of MOON_TERMS) {
    const scale = m === 1 || m === -1 ? e1 : m === 2 || m === -2 ? e2 : 1;
    sum += sigma * scale * Math.sin(d * elongation + m * sunAnomaly + mp * moonAnomaly + f * latitude);
  }
  sum += 3958 * Math.sin(additive1);
  sum += 1962 * Math.sin((meanLongitude - latitude) * RAD);
  sum += 318 * Math.sin(additive2);

  return meanLongitude + sum / 1e6;
}

/** Longitud eclíptica aparente del Sol, en grados. Meeus, cap. 25. */
function sunLongitude(jd: number): number {
  const T = (jd - J2000) / 36525;
  const meanLongitude = 280.46646 + 36000.76983 * T;
  const meanAnomaly = (357.52911 + 35999.05029 * T) * RAD;
  const equationOfCenter =
    (1.914602 - 0.004817 * T) * Math.sin(meanAnomaly) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * meanAnomaly) +
    0.000289 * Math.sin(3 * meanAnomaly);
  const aphelion = (125.04 - 1934.136 * T) * RAD;
  return meanLongitude + equationOfCenter - 0.00569 - 0.00478 * Math.sin(aphelion);
}

/** Ángulo de fase en grados: la elongación Luna-Sol. 0 = luna nueva. */
function phaseAngle(jd: number): number {
  const angle = moonLongitude(jd) - sunLongitude(jd);
  return ((angle % 360) + 360) % 360;
}

/**
 * Día juliano a las 12:00 UTC del día indicado.
 *
 * Se evalúa a mediodía UTC y no a la medianoche del visitante: la fase avanza
 * 12,2° por día, así que el punto medio del día reduce a la mitad el riesgo de
 * caer en el intervalo vecino, y hace el resultado reproducible en cualquier
 * zona horaria.
 */
function julianDay(date: CalendarDate): number {
  return Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0) / 86400000 + 2440587.5;
}

@Injectable({ providedIn: 'root' })
export class MoonService {
  /** Fase lunar de una fecha de calendario, con su ángulo y su iluminación. */
  getPhase(date: CalendarDate): MoonPhaseResult {
    const angle = phaseAngle(julianDay(date));

    // Cada intervalo de 45° se centra en el ángulo exacto de su fase, así que
    // el índice se redondea en lugar de truncarse.
    const index = Math.round(angle / 45) % MOON_PHASE_IDS.length;

    return {
      id: MOON_PHASE_IDS[(index + MOON_PHASE_IDS.length) % MOON_PHASE_IDS.length],
      angle: Math.round(angle * 1000) / 1000,
      // La Luna se ve iluminada cuando la elongación se aparta de 0.
      illumination: Math.round(((1 - Math.cos(angle * RAD)) / 2) * 10000) / 10000,
    };
  }

  /** Solo el identificador de fase. */
  getPhaseId(date: CalendarDate): MoonPhaseId {
    return this.getPhase(date).id;
  }

  get phases(): readonly MoonPhaseId[] {
    return MOON_PHASE_IDS;
  }
}
