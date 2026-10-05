import { Evidence, EvidenceDirection, EvidenceFamily } from '../models/inner.model';

/**
 * ADAPTADOR: questions.json -> Evidence[]
 *
 * Convierte el banco de datos en las evidencias que consume el interprete de
 * la Diosa. Es la UNICA pieza que conecta los datos con la logica.
 *
 * Que hace:
 *   - Lee la etiqueta de cada opcion (family, subtype, unresolved, verified,
 *     interpretiveAmbiguity, aloneInsufficient).
 *   - Lee canBless de la PREGUNTA, no de la opcion.
 *   - Descarta las opciones sin etiqueta: no son perfil (son capa de reino).
 *
 * Que NO hace, deliberadamente:
 *   - No deduce nada. Si una opcion no tiene etiqueta, no produce evidencia.
 *   - No puntua. No hay numeros aqui.
 *   - No infiere canBless desde el subtipo. Se lee del dato.
 */

/** Subtipos que la autora NO aprobó. Se ignoran. */
const PROVISIONAL = 'PROVISIONAL';

/** Forma de una opción tal y como vive en questions.json. */
export interface BankChoice {
  readonly id: string;
  readonly text: string;
  /**
   * Afinidad con cada reino, -3..+3.
   *
   * Solo la capa de reino lo usa. Las preguntas de perfil interno la tienen
   * a CERO a proposito: no identifican un reino, identifican a la persona.
   */
  readonly legacyAffinity?: Readonly<Record<string, number>>;
  readonly evidence?: {
    readonly family: EvidenceFamily;
    readonly subtype: string;
    readonly direction: EvidenceDirection;
    readonly unresolved: boolean;
    readonly verified: boolean;
    readonly interpretiveAmbiguity: boolean;
    readonly aloneInsufficient?: boolean;
    readonly status: string;
    readonly lee: string;
  };
}

export interface BankQuestion {
  readonly id: string;
  readonly theme: string;
  readonly text: string;
  readonly feedsProfile?: boolean;
  readonly canBless?: boolean | 'PENDIENTE';
  readonly choices: readonly BankChoice[];
}

export interface AdaptResult {
  readonly evidence: readonly Evidence[];
  /** Preguntas del perfil que NO tienen canBless decidido. */
  readonly undecidedQuestions: readonly string[];
  /** Preguntas del perfil con canBless:true. */
  readonly blessingQuestions: readonly string[];
  /** Opciones del perfil sin etiqueta aprobada. */
  readonly unlabelled: readonly string[];
}

/**
 * @throws si una pregunta del perfil tiene canBless sin decidir. Es preferible
 *   fallar en desarrollo a que el motor adivine si puede o no bendecer.
 */
export function toEvidence(bank: readonly BankQuestion[]): AdaptResult {
  const evidence: Evidence[] = [];
  const undecided: string[] = [];
  const blessingQuestions: string[] = [];
  const unlabelled: string[] = [];

  for (const question of bank) {
    if (!question.feedsProfile) continue;

    if (question.canBless === undefined || question.canBless === 'PENDIENTE') {
      throw new Error(
        `La pregunta "${question.id}" (${question.theme}) no tiene canBless decidido. ` +
          'Es una decision de la autora y el motor no la deduce.',
      );
    }
    if (question.canBless) blessingQuestions.push(question.id);

    for (const choice of question.choices) {
      const tag = choice.evidence;

      if (!tag) {
        unlabelled.push(`${question.id}/${choice.id}`);
        continue;
      }
      if (tag.status?.startsWith(PROVISIONAL)) {
        unlabelled.push(`${question.id}/${choice.id} (provisional)`);
        continue;
      }

      evidence.push({
        questionId: question.id,
        choiceId: choice.id,
        text: choice.text,
        family: tag.family,
        subtype: tag.subtype,
        direction: tag.direction,
        unresolved: tag.unresolved,
        verified: tag.verified,
        interpretiveAmbiguity: tag.interpretiveAmbiguity,
        aloneInsufficient: tag.aloneInsufficient ?? false,
        questionCanBless: question.canBless === true,
        lee: tag.lee,
      });
    }
  }

  return {
    evidence,
    undecidedQuestions: undecided,
    blessingQuestions,
    unlabelled,
  };
}