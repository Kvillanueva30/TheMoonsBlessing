/**
 * Tipos del motor de resultados.
 *
 * REGLA ESTRUCTURAL: estos tipos no contienen NINGUNA regla de lore. Solo
 * describen la forma de los datos. Las reglas viven en data/lore-rules.json y
 * los reinos en data/kingdoms/*.json. Si alguien necesita una constante de
 * comportamiento, va en el JSON.
 *
 * Ejes independientes, según docs/motor-design.md:
 *
 *   fecha real  ->  moon        (capa simbólica, SIN aristas a nada más)
 *   respuestas  ->  desire      (lo que quiere)
 *                 ->  need       (lo que necesita por dentro)
 *                 ->  legacies   (afinidad con legados)
 *                        -> kingdom
 *                              -> nature
 */

// ---------------------------------------------------------------------------
// Luna
// ---------------------------------------------------------------------------

/** Fecha del visitante. El dia se evalua a las 12:00 UTC: la fase lunar no depende de la zona horaria. */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

/**
 * Salida de MoonService. Se reexporta desde aqui para que el modelo del
 * resultado no tenga que duplicar la forma.
 *
 * NO se redeclara el tipo: se importa. Declararlo aparte es como aparecio un
 * MoonPhaseResult con campos que no existen (phaseId, phaseName, age).
 */
export type { MoonPhaseResult } from '../services/moon.service';

/** Import para uso local en este archivo. */
import type { MoonPhaseResult } from '../services/moon.service';

// ---------------------------------------------------------------------------
// Reinos y naturalezas
// ---------------------------------------------------------------------------

export type KingdomId = 'ederian' | 'bastia' | 'tralan' | 'xorian' | 'tradia' | 'helia';

/** Identificadores de naturaleza. El orden NO implicaBondad: Cazut no es malo. */
export type NatureId = 'manskling' | 'diubak' | 'cazut';

/** Los tres mecanismos por los que puede originarse una naturaleza. */
export type OriginId = 'blessing' | 'lineage' | 'curse';

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

/** Una eleccion del visitante. Solo el id: el motor carga el texto del banco. */
export interface AnswerSet {
  questionId: string;
  choiceId: string;
}

/** Lo que el motor lee de una opcion. Nunca se muestra al visitante. */
export interface ChoiceScore {
  /** Afinidad con el LEGADO de cada reino, -3..+3. No es "ser el fundador". */
  readonly legacyAffinity: Readonly<Record<KingdomId, number>>;
  /** cuanto el deseo apunta hacia fuera: poder, estatus, reconocimiento. 0..3 */
  readonly wishOutside: number;
  /** Necesidad interna no resuelta. 0 = estoy completo siendo quien soy. 0..3 */
  readonly innerNeed: number;
}

/** Una opcion tal y como vive en data/questions/questions.json. */
export interface QuestionChoice extends ChoiceScore {
  readonly id: string;
  readonly text: string;
}

/** Una pregunta tal y como vive en data/questions/questions.json. */
export interface Question {
  readonly id: string;
  readonly theme: string;
  readonly axis: string;
  readonly text: string;
  readonly choices: readonly QuestionChoice[];
}

// ---------------------------------------------------------------------------
// Salida del motor
// ---------------------------------------------------------------------------

export interface LegacyAffinity {
  readonly kingdomId: KingdomId;
  readonly score: number;
}

/**
 * La Luna es un valor AISLADO.
 *
 * No existe ninguna arista desde MoonPhaseResult hacia kingdom ni nature.
 * El motor no la consulta al calcular ninguna de las dos. Si algun dia alguien
 * necesita unirla, hay que revisar antes docs/motor-design.md §1.
 */
export interface MadarResult {
  readonly moon: MoonPhaseResult;
  readonly kingdom: KingdomId;
  /** Todas las afinidades, ordenadas de mayor a menor. INCLUDING las perdedoras. */
  readonly legacies: readonly LegacyAffinity[];
  readonly nature: NatureId;
  readonly origin: OriginId;
  /** Deseo acumulado. Informativo: NO decide por si solo. */
  readonly desire: number;
  /** Necesidad interna acumulada. Junto al deseo, forma el criterio de la bendicion. */
  readonly need: number;
  /**
   * Siempre null en esta version.
   *
   * BETWEEN es un concepto especial de Anika Griffin, no una cuarta naturaleza
   * y no una cuarta puntuacion. No hay formula definida y no se inventa una.
   * Ver docs/motor-design.md §7 y data/lore-rules.json.
   */
  readonly between: null;
}

/**
 * Entrada del motor.
 *
 * `moon` entra ya calculado: el motor no sabe nada de astronomia.
 * `answers` son ids, porque el texto vive en el banco de datos.
 */
export interface MadarInput {
  readonly moon: MoonPhaseResult;
  readonly answers: readonly AnswerSet[];
}