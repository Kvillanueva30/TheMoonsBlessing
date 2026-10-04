// Servicio de cálculo lunar.
//
// Implementación base con algoritmo astronómico simplificado usando el
// mes sinódico de referencia. Puede reemplazarse por una librería fiable
// en el futuro sin tocar la UI.
import { Injectable } from '@angular/core';

const SYNODIC_MONTH = 29.530588853;

// Fases en orden a partir de luna nueva.
const PHASE_IDS = [
  'new-moon',
  'waxing-crescent',
  'first-quarter',
  'waxing-gibbous',
  'full-moon',
  'waning-gibbous',
  'last-quarter',
  'waning-crescent',
] as const;

export type MoonPhaseId = (typeof PHASE_IDS)[number];

@Injectable({ providedIn: 'root' })
export class MoonService {
  /**
   * Devuelve la fase lunar más probable para una fecha dada.
   * Basado en una luna nueva de referencia (2000-01-06).
   */
  getPhase(date: Date): MoonPhaseId {
    const reference = new Date(Date.UTC(2000, 0, 6, 18, 14));
    const deltaDays = (date.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24);
    const cycle = ((deltaDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
    const index = Math.floor((cycle / SYNODIC_MONTH) * PHASE_IDS.length) % PHASE_IDS.length;
    return PHASE_IDS[index];
  }

  /** Retorna lista de fases para renderizar o seleccionar. */
  get phases(): readonly MoonPhaseId[] {
    return PHASE_IDS;
  }
}
