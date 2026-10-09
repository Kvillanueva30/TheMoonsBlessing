import { Injectable, inject } from '@angular/core';
import { CalendarDate, MoonPhaseResult, MoonService } from './moon.service';
import { BankChoice, BankQuestion, toEvidence } from '../engine/evidence.adapter';
import { interpretGoddess } from '../engine/goddess.engine';
import { GoddessResult, NatureId } from '../models/inner.model';
import { KingdomId } from '../models/ritual.model';

/**
 * SESION DE LA CEREMONIA.
 *
 * Reune las TRES salidas del resultado y las mantiene separadas:
 *
 *   moon     fecha real del visitante.  NO toca reino ni naturaleza.
 *   kingdom  afinidad con los legados.  Puntuacion.
 *   nature   interpretacion del perfil. Cualitativo.
 *
 * La luna se calcula APARTE a proposito. Unirla con los otros dos campos es
 * exactamente lo que el canon prohibe. Si alguien lo hace, este archivo es el
 * primer sitio que hay que revisar.
 */
export interface RitualResult {
  readonly moon: MoonPhaseResult;
  readonly kingdomId: KingdomId;
  readonly kingdomName: string;
  readonly natures: readonly NatureId[];
  readonly nature: GoddessResult;
}

@Injectable({ providedIn: 'root' })
export class RitualSessionService {
  private readonly moonService = inject(MoonService);

  /** questionId -> choiceId. Se rellena al terminar las preguntas. */
  private answers: Readonly<Record<string, string>> = {};

  setAnswers(answers: Readonly<Record<string, string>>): void {
    this.answers = { ...answers };
  }

  reset(): void {
    this.answers = {};
  }

  /** Luna de nacimiento. Aislada: no depende de nada mas. */
  getMoon(date: CalendarDate): MoonPhaseResult {
    return this.moonService.getPhase(date);
  }

  /**
   * Reino por afinidad con los legados.
   *
   * Solo cuentan las respuestas con afinidad no nula. Las preguntas de perfil
   * interno puntuan cero a proposito y no aportan nada aqui.
   *
   * El desempate usa una semilla derivada del propio resultado: es
   * determinista (recargar no cambia el reino) y no favorece a ningun reino
   * por como se llama. Desempatar por orden alfabetico SESGABA a Ederian y
   * castigaba a Ross.
   */
  getKingdom(questions: readonly BankQuestion[], kingdomIds: readonly KingdomId[]): KingdomId {
    const scores = new Map<KingdomId, number>(kingdomIds.map((id) => [id, 0]));

    for (const question of questions) {
      const choiceId = this.answers[question.id];
      if (!choiceId) continue;
      const choice = question.choices.find((c) => c.id === choiceId);
      if (!choice?.legacyAffinity) continue;
      for (const [id, value] of Object.entries(choice.legacyAffinity ?? {})) {
        const key = id as KingdomId;
        const amount = typeof value === 'number' ? value : 0;
        if (scores.has(key)) scores.set(key, (scores.get(key) ?? 0) + amount);
      }
    }

    const best = Math.max(...scores.values());
    const contenders = [...scores.entries()].filter(([, s]) => s === best).map(([id]) => id);

    if (contenders.length === 1) return contenders[0];
    return seededPick(contenders, seedFrom(this.answers));
  }

  /**
   * Interpretacion de la naturaleza.
   *
   * Solo intervienen las preguntas con canBless. El canon del reino se le pasa
   * aparte y SIEMPRE gana sobre la naturaleza VIGENTE: si el reino esta
   * maldito, hoy eres Cazut aunque el perfil diga otra cosa.
   *
   * El clasificador corre igual y su veredicto queda en `originalNature`, que
   * es una INFERENCIA de las respuestas, no un dato historico. Y `transformed`
   * solo se activa si el dato del reino declara la transformacion historica.
   */
  getNature(
    questions: readonly BankQuestion[],
    canonicalNature: readonly NatureId[],
    historicalTransformation: boolean = false,
  ): GoddessResult {
    const { evidence } = toEvidence(questions);
    const chosen = evidence.filter((e) => this.answers[e.questionId] === e.choiceId);
    return interpretGoddess({ evidence: chosen, canonicalNature, historicalTransformation });
  }
}

function seedFrom(answers: Readonly<Record<string, string>>): number {
  let hash = 0x811c9dc5;
  for (const key of Object.keys(answers).sort()) {
    const k = `${key}:${answers[key]}`;
    for (let i = 0; i < k.length; i++) {
      hash ^= k.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash >>> 0;
}

function seededPick(candidates: readonly KingdomId[], seed: number): KingdomId {
  const ordered = [...candidates].sort();
  let state = seed >>> 0 || 1;
  for (let i = 0; i < ordered.length; i++) {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5;
    state >>>= 0;
  }
  return ordered[state % ordered.length];
}