import {
  AnswerSet,
  KingdomId,
  LegacyAffinity,
  MadarInput,
  MadarResult,
  NatureId,
  OriginId,
  Question,
  ChoiceScore,
} from '../models/ritual.model';

/**
 * Motor de resultados de Madar.
 *
 * Puro y sin dependencias de Angular: se puede ejecutar en un test sin UI, que
 * es el requisito del proyecto. La UI lee el resultado; el motor no sabe que
 * existe una UI.
 *
 * ----------------------------------------------------------------------------
 * LO QUE ESTE ARCHIVO NO PUEDE CONTENER
 * ----------------------------------------------------------------------------
 *
 * Hardcodear reglas de lore esta prohibido. En concreto:
 *
 *   - NO hay lista de reinos malditos. Se lee de kingdoms[].natures.
 *   - NO hay texto de naturaleza. Se lee de results.natures.
 *   - NO hay formula de Between. `between` es siempre null.
 *   - NO hay umbral magico de luz. Ver mas abajo.
 *
 * Si hace falta una regla nueva, se escribe en data/lore-rules.json primero y
 * se pasa por aqui como parametro.
 */

// ---------------------------------------------------------------------------
// Umbrales del criterio de la bendicion
// ---------------------------------------------------------------------------

/**
 * Por encima de este valor en `need`, se considera que hay una necesidad
 * interna que la persona no puede resolver por si misma.
 *
 * Viene del canon: la Diosa Luna bendice a quien ve con una necesidad interior
 * que esa persona todavia no comprende. Ver data/lore-rules.json ->
 * policies.blessing.criterion.
 */
export const BLESSING_THRESHOLD = 2;

/** Leyendo el banco: el eje `blessing` reparte 0..3 por opcion. */
const BLESSING_MAX_PER_CHOICE = 3;

// ---------------------------------------------------------------------------
// Reglas del reino, leidas de los datos
// ---------------------------------------------------------------------------

/**
 * Un reino visto por el motor: solo naturalezas y fundador.
 * Deliberadamente no incluye `type`: ese campo ya no existe.
 */
export interface KingdomRule {
  readonly id: KingdomId;
  readonly name: string;
  /** Vacio = naturaleza no determinada por el reino. Cazut tiene uno. */
  readonly natures: readonly NatureId[];
  readonly founder?: { readonly name: string; readonly title?: string };
}

/** Regla de naturaleza tal y como vive en data/results/results.json. */
export interface NatureRule {
  readonly headline: string;
  readonly meaning: string;
}

// ---------------------------------------------------------------------------
// Entrada completa del motor
// ---------------------------------------------------------------------------

export interface RitualInput {
  readonly input: MadarInput;
  readonly questions: readonly Question[];
  readonly kingdoms: readonly KingdomRule[];
  readonly natureRules: Readonly<Record<NatureId, NatureRule>>;
}

// ---------------------------------------------------------------------------
// Calculo
// ---------------------------------------------------------------------------

/**
 * Resuelve el resultado completo de una sesion.
 *
 * @throws si una respuesta apunta a una pregunta u opcion inexistente. Es
 *   preferible fallar en desarrollo que adivinar en produccion.
 */
export function resolveRitual(ritual: RitualInput): MadarResult {
  const { input, questions, kingdoms } = ritual;

  // La configuracion se valida antes que las respuestas: si el motor esta mal
  // configurado, ese es el error que hay que ver, no el de una sesion vacia.
  if (kingdoms.length === 0) {
    throw new Error('No hay reinos configurados. No se puede deducir el reino.');
  }

  const scored = scoreChoices(input.answers, questions);

  // Sin respuestas no hay nada que deducir. Devolver un reino por defecto
  // seria inventar el resultado del visitante, y el visitante es quien decide.
  if (scored.length === 0) {
    throw new Error('El visitante no respondio nada. No se puede deducir un resultado.');
  }

  const legacies = rankLegacies(scored, kingdoms);
  const kingdom = pickKingdom(legacies, kingdoms, tieBreakSeed(input.answers));
  const { nature, origin } = decideNature(scored, kingdom);

  return {
    // Se pasa por valor. La luna no toca nada mas.
    moon: input.moon,
    kingdom: kingdom.id,
    legacies,
    nature,
    origin,
    desire: sum(scored, (c) => c.wishOutside),
    need: sum(scored, (c) => c.innerNeed),
    between: null,
  };
}

// ---------------------------------------------------------------------------
// Paso 1: resolver las respuestas a puntuaciones
// ---------------------------------------------------------------------------

function scoreChoices(
  answers: readonly AnswerSet[],
  questions: readonly Question[],
): readonly ChoiceScore[] {
  const byQuestion = new Map(questions.map((q) => [q.id, q]));

  return answers.map((answer) => {
    const question = byQuestion.get(answer.questionId);
    if (!question) {
      throw new Error(
        `Respuesta "${answer.questionId}" no corresponde a ninguna pregunta del banco.`,
      );
    }
    const choice = question.choices.find((c) => c.id === answer.choiceId);
    if (!choice) {
      throw new Error(
        `La pregunta "${answer.questionId}" no tiene la opcion "${answer.choiceId}".`,
      );
    }
    return choice;
  });
}

// ---------------------------------------------------------------------------
// Paso 2: afinidad con los legados
// ---------------------------------------------------------------------------

/**
 * Suma la afinidad de cada opcion por reino y la ordena.
 *
 * Devuelve TODOS los reinos, no solo el ganador: el resultado tiene que poder
 * explicar por que se eligio uno. El visitante no ve estos numeros.
 */
function rankLegacies(
  scored: readonly ChoiceScore[],
  kingdoms: readonly KingdomRule[],
): readonly LegacyAffinity[] {
  const totals = new Map<KingdomId, number>(
    kingdoms.map((k) => [k.id, 0]),
  );

  for (const choice of scored) {
    // Una pregunta que no es de reino (las de bendicion y las de caracter) no
    // trae afinidad con legado. Antes esto reventaba con
    // "Cannot read properties of undefined"; ahora aporta 0, que es lo
    // correcto: no dice nada de ningun reino.
    const affinityByKingdom = choice.legacyAffinity;
    if (!affinityByKingdom) continue;

    for (const kingdom of kingdoms) {
      const affinity = affinityByKingdom[kingdom.id] ?? 0;
      totals.set(kingdom.id, (totals.get(kingdom.id) ?? 0) + affinity);
    }
  }

  return [...totals.entries()]
    .map(([kingdomId, score]) => ({ kingdomId, score }))
    .sort((a, b) => b.score - a.score || a.kingdomId.localeCompare(b.kingdomId));
}

/**
 * El reino con mas afinidad.
 *
 * El visitante NUNCA elige reino.
 *
 * DESEMPATE. Un empate por nombre seria un sesgo, no una regla. Desempatar por
 * orden alfabetico favorece a 'ederian' (primero) y castiga a 'tralan'
 * (ultimo), y se comprobó que eso hacia que Ross perdiera casi todos sus
 * empates contra Tarik. Un desempate no puede decidir el reino de alguien.
 *
 * Se usa un PRNG con semilla derivada de las propias respuestas: el resultado
 * sigue siendo determinista (mismas entradas, mismo reino) pero ningun reino
 * queda favorecido por como se llama.
 *
 * Un empate sigue siendo un defecto del banco, no una decision del visitante.
 * Ver questions.json -> coverageReport.
 *
 * @throws si no hay ningun reino configurado.
 */
function pickKingdom(
  legacies: readonly LegacyAffinity[],
  kingdoms: readonly KingdomRule[],
  tieBreakSeed: number,
): KingdomRule {
  if (legacies.length === 0) {
    throw new Error('Las afinidades salieron vacias. No se puede deducir un reino.');
  }

  const best = legacies[0].score;
  const contenders = legacies.filter((l) => l.score === best).map((l) => l.kingdomId);

  const winnerId = contenders.length === 1 ? contenders[0] : seededPick(contenders, tieBreakSeed);

  const winner = kingdoms.find((k) => k.id === winnerId);
  if (!winner) {
    throw new Error(`El reino "${winnerId}" tiene afinidad pero no existe en los datos.`);
  }
  return winner;
}

/**
 * Elige uno entre varios de forma determinista y sin favorece a ninguno.
 *
 * PRNG xorshift32. La semilla se deriva de las respuestas del visitante, asi que
 * recargar la pagina da el mismo reino, pero el reparto de empates es uniforme.
 */
function seededPick(candidates: readonly KingdomId[], seed: number): KingdomId {
  // Orden estable previo, para que el PRNG siempre reciba la misma lista.
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

// ---------------------------------------------------------------------------
// Paso 3: la naturaleza
// ---------------------------------------------------------------------------

interface NatureDecision {
  readonly nature: NatureId;
  readonly origin: OriginId;
}

/**
 * Decide naturaleza y origen.
 *
 * Dos caminos, y solo dos:
 *
 * 1. Reino con una sola naturaleza posible (los malditos). La naturaleza viene
 *    de la maldicion. No se consulta el deseo ni la necesidad: no tienen voz
 *    aqui. El reino no les da alternativa.
 *
 * 2. Reino con varias naturalezas posibles. Entonces decide la bendicion, y la
 *    bendicion mira la NECESIDAD INTERNA, no el deseo y no la moralidad.
 */
function decideNature(
  scored: readonly ChoiceScore[],
  kingdom: KingdomRule,
): NatureDecision {
  // Camino 1: el reino no deja alternativa.
  if (kingdom.natures.length === 1) {
    return { nature: kingdom.natures[0], origin: 'curse' };
  }

  // Camino 2: el reino permite varias. Decide la bendicion.
  const need = average(scored, (c) => c.innerNeed);
  if (needsBlessing(scored, need)) {
    return { nature: 'diubak', origin: 'blessing' };
  }
  return { nature: 'manskling', origin: 'blessing' };
}

/**
 * El criterio de la bendicion, y nada mas.
 *
 * La Diosa Luna ve una necesidad interna que la persona no puede resolver sola.
 * Por eso el criterio mira `innerNeed` y NO mira el deseo: Benny queria ser
 * Diubak y no lo necesitaba, y el canon lo deja como Manskling. Una necesidad
 * interna no resuelta es lo unico que produce la bendicion.
 *
 * El deseo (`wishOutside`) se acumula y se muestra como informacion, pero no
 * decide. Y el caracter, la moralidad, el sacrificio y la lealtad no entran
 * aqui. Ver data/lore-rules.json -> policies.blessing.forbiddenMappings.
 */
function needsBlessing(
  scored: readonly ChoiceScore[],
  averageNeed: number,
): boolean {
  if (scored.length === 0) {
    return false;
  }
  // Normalizado: una pregunta no puede pesar mas que varias.
  return averageNeed >= BLESSING_THRESHOLD / BLESSING_MAX_PER_CHOICE;
}

/**
 * Semilla del desempate, derivada de las respuestas.
 *
 * Se usa para que el resultado sea reproducible sin que el nombre del reino
 * influya. Ver pickKingdom.
 */
function tieBreakSeed(answers: readonly AnswerSet[]): number {
  let hash = 0x811c9dc5;
  for (const answer of answers) {
    const key = `${answer.questionId}:${answer.choiceId}`;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash >>> 0;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function sum(values: readonly ChoiceScore[], pick: (c: ChoiceScore) => number): number {
  return values.reduce((total, c) => total + pick(c), 0);
}

function average(
  values: readonly ChoiceScore[],
  pick: (c: ChoiceScore) => number,
): number {
  if (values.length === 0) return 0;
  return sum(values, pick) / values.length;
}

/**
 * Advertencia para quien lea este archivo: `NatureId` esta ordenado
 * alfabeticamente, NO por valor moral. 'cazut' es el primero y no es el malo.
 * Que la collation delija ese orden no significa nada. Cazut no es maldad:
 * Alden es Cazut y noble. Manskling no es bondad: Gil esta en paz, y eso es
 * completitud, no moralidad.
 */
export const NATURE_IS_NOT_MORALITY = true;