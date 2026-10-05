import {
  Evidence,
  EvidenceFamily,
  GoddessResult,
  InnerProfile,
  Interpretation,
  NatureId,
  OriginId,
  Revelation,
} from '../models/inner.model';

/**
 * INTERPRETE DE LA DIOSA.
 *
 * Puro. Sin Angular. Se ejecuta sin UI.
 *
 * ----------------------------------------------------------------------------
 * LO QUE ESTE ARCHIVO NO PUEDE CONTENER
 * ----------------------------------------------------------------------------
 *
 * Ninguna regla del tipo "subtipo X -> naturaleza Y". Ningun umbral. Ningun
 * score. Ninguna cuenta de evidencias.
 *
 * Los subtipos son EVIDENCIA SEMANTICA. El interprete lee un conjunto de
 * observaciones cualitativas sobre el conjunto del perfil, no cuenta etiquetas.
 *
 * ----------------------------------------------------------------------------
 * LAS TRES PREGUNTAS QUE DEFINE LA OBSERVACION
 * ----------------------------------------------------------------------------
 *
 * Se eligieron porque son cualitativas y porque los tres casos canonicos se
 * separan con ellas sin contar nada:
 *
 *   1. innerNeedWithContent
 *      Hay una necesidad interna CON CONTENIDO. Solo la sostienen
 *      located_identity y misdirected_remedy, y solo si NO son
 *      aloneInsufficient. Gil y Benny no la tienen. Darya si.
 *
 *   2. remediationPattern
 *      La persona esta HACIENDO ALGO sobre lo que siente. evidenced por
 *      haber intentado un remedio y fallado, o por haber decidido ya. Esto NO
 *      es "sabe que tiene un problema": es "esta actuando sobre el".
 *
 *   3. inwardDirection
 *      La persona reconoce que lo que busca no esta fuera. Es DIRECCION, no
 *      necesidad. Darya la tiene. Benny no.
 *
 * Gil y Benny tienen las tres en falso. Se distinguen porque Gil tiene
 * suficiencia y Benny tiene deseo externo sin necesidad interna enlazada.
 *
 * ----------------------------------------------------------------------------
 * CASO ABIERTO, Y NO SE RESUELVE AQUI
 * ----------------------------------------------------------------------------
 *
 * Deseo externo (tipo Benny) combinado con una sola evidencia de direccion
 * interna (tipo Darya). El banco no cubre ese perfil. Esta implementacion
 * tampoco lo inventa: cae en el mismo lugar que Darya porque la unica lectura
 * honesta es "no hay evidencia suficiente para distinguirlo". Ver
 * docs/inner-profile-cases.md.
 */

const FAMILIES: readonly EvidenceFamily[] = [
  'sufficiency',
  'inner_search',
  'external_desire',
  'desire_vs_need',
  'relational_boundary',
  'character_only',
];

/**
 * Subtipos que describen una necesidad interna CON CONTENIDO.
 *
 * La diferencia con unlocated / unidentified / unformulable es que estos no
 * dicen QUE falta. Estos dicen que falta y de que.
 *
 * No es una regla de naturaleza: es una clasificacion de lo que la frase
 * demuestra. La decision se toma despues, sobre el conjunto.
 */
const CONTENT_BEARING = new Set(['located_identity', 'misdirected_remedy']);

/**
 * Subtipos que evidencian pauta de remediacion.
 *
 * O la persona intento un remedio y fallo, o ya decidio que va a cambiar. En
 * ambos casos esta ACTUANDO, no solo、广 sintiendo.
 */
const REMEDIATING = new Set(['misdirected_remedy', 'inward_declared']);

const INWARD_DECLARED = 'inward_declared';
const OUTWARD_DESIRE = 'external_desire';
const SUFFICIENCY = 'sufficiency';

/** Necesidad interna con contenido y sin ambiguedad interpretativa. */
function hasInnerNeedWithContent(e: readonly Evidence[]): boolean {
  return e.some(
    (x) =>
      CONTENT_BEARING.has(x.subtype) &&
      !x.aloneInsufficient &&
      !x.interpretiveAmbiguity,
  );
}

function hasRemediationPattern(e: readonly Evidence[]): boolean {
  return e.some(
    (x) => REMEDIATING.has(x.subtype) && !x.aloneInsufficient && !x.interpretiveAmbiguity,
  );
}

function hasInwardDirection(e: readonly Evidence[]): boolean {
  return e.some(
    (x) => x.subtype === INWARD_DECLARED && !x.aloneInsufficient && !x.interpretiveAmbiguity,
  );
}

/**
 * Cuantas evidencias DISTINTAS sostienen la lectura de necesidad interna.
 *
 * Existe por una razon concreta: `misdirected_remedy` cumple por si solo las
 * dos condiciones de la bendicion (necesidad interna con contenido Y pauta de
 * remediacion). Sin este recuento, UNA sola respuesta produciria Diubak, que es
 * exactamente la regla de subtipo que la autora prohibio.
 *
 * NO es un umbral de score. Es que una respuesta aporta una pieza, no el
 * veredicto: la interpretacion trabaja sobre el perfil, no sobre una opcion.
 */
function supportingEvidence(e: readonly Evidence[]): number {
  return new Set(
    e
      .filter(
        (x) =>
          (CONTENT_BEARING.has(x.subtype) || REMEDIATING.has(x.subtype)) &&
          !x.aloneInsufficient &&
          !x.interpretiveAmbiguity,
      )
      .map((x) => `${x.questionId}/${x.choiceId}`),
  ).size;
}

function hasSufficiency(e: readonly Evidence[]): boolean {
  return e.some((x) => x.family === SUFFICIENCY);
}

// ---------------------------------------------------------------------------
// Construccion del perfil
// ---------------------------------------------------------------------------

/**
 * Construye el perfil a partir de las evidencias ya resueltas.
 *
 * No decide nada. Solo separa lo que viene de preguntas que pueden bendecir de
 * lo que viene de las que no, y agrupa por familia y subtipo.
 */
export function buildProfile(evidence: readonly Evidence[]): InnerProfile {
  const blessingEvidence = evidence.filter((e) => e.questionCanBless);
  const contextEvidence = evidence.filter((e) => !e.questionCanBless);

  const byFamily = Object.fromEntries(
    FAMILIES.map((f) => [f, blessingEvidence.filter((e) => e.family === f)]),
  ) as unknown as Record<EvidenceFamily, readonly Evidence[]>;

  const bySubtype: Record<string, Evidence[]> = {};
  for (const e of blessingEvidence) {
    (bySubtype[e.subtype] ??= []).push(e);
  }

  return { blessingEvidence, contextEvidence, byFamily, bySubtype };
}

// ---------------------------------------------------------------------------
// Interpretacion
// ---------------------------------------------------------------------------

export function interpret(profile: InnerProfile): Interpretation {
  const e = profile.blessingEvidence;

  const innerNeedWithContent = hasInnerNeedWithContent(e);
  const remediationPattern = hasRemediationPattern(e);
  const inwardDirection = hasInwardDirection(e);

  /**
   * Deseo externo que NO esta unido a ninguna necesidad interna.
   *
   * Es el caso de Benny: quiere reconocimiento, quiere estatus, y no le falta
   * nada por dentro.
   *
   * NO puede ser cierto si la persona ha declarado direccion interna. En ese
   * caso SI hay algo suyo en juego, y decir "por dentro no te falta nada"
   * contradiria la evidencia que el propio visitante produzco.
   */
  const hasOutward = e.some((x) => x.family === OUTWARD_DESIRE && !x.aloneInsufficient);
  const unlinkedOutwardDesire = hasOutward && !innerNeedWithContent && !inwardDirection;

  return {
    innerNeedWithContent,
    remediationPattern,
    inwardDirection,
    unlinkedOutwardDesire,
    sufficiency: hasSufficiency(e),
  };
}

// ---------------------------------------------------------------------------
// Revelation
// ---------------------------------------------------------------------------

/**
 * Construye la revelacion.
 *
 * ORIGEN DE LA NATURALEZA:
 *
 *   El canon manda SIEMPRE. Si el reino tiene una naturaleza determinada por
 *   su historia, el interprete psicologico no la toca. Ver
 *   canonicalNature, abajo.
 *
 *   Cuando el canon NO determina la naturaleza, decide la interpretacion.
 *   Y decide por el CONJUNTO:
 *
 *     necesidad interna con contenido  Y  pauta de remediacion
 *
 *   Que es lo que distingue a Darya. Gil no tiene ninguna de las dos. Benny no
 *   tiene ninguna de las dos y ademas tiene deseo externo sin enlazar.
 *
 *   Un perfil con solo direccion interna y sin remediacion NO puede sortear
 *   por este camino: la direccion no es necesidad. Es el caso abierto, y aqui
 *   cae como "no hay evidencia suficiente".
 */
export function reveal(
  profile: InnerProfile,
  reading: Interpretation,
  canonicalNature: readonly NatureId[],
): Revelation {
  const grounds = [...profile.blessingEvidence];
  const support = supportingEvidence(profile.blessingEvidence);

  // --- El canon manda
  if (canonicalNature.length === 1) {
    const nature = canonicalNature[0];
    const origin: OriginId = nature === 'cazut' ? 'curse' : 'lineage';
    return {
      nature,
      origin,
      believed: externalDesire(profile),
      perceived: [],
      reason:
        nature === 'cazut'
          ? 'Tu reino esta bajo la maldicion. Tu naturaleza viene de ahi, no de lo que hay en ti.'
          : 'Tu naturaleza viene del linaje, no de una decision interior.',
      grounds,
      unsatisfied: false,
    };
  }

  // --- El canon no determina: decide la interpretacion del conjunto
  const perceived = innerEvidence(profile);
  const believed = externalDesire(profile);

  /**
   * La bendicion requiere ADEMAS que la lectura se sostenga en mas de una
   * evidencia distinta. `misdirected_remedy` cumple por si solo las dos
   * condiciones, y una sola respuesta no puede ser el veredicto de un perfil.
   */
  if (reading.innerNeedWithContent && reading.remediationPattern && support >= 2) {
    return {
      nature: 'diubak',
      origin: 'divine_blessing',
      believed,
      perceived,
      reason:
        'Hay algo que no logras resolver tu mismo y ya has probado que lo de fuera no lo cierra. ' +
        'Eso es lo que la Diosa ve.',
      grounds,
      unsatisfied: perceived.some((e) => e.unresolved),
    };
  }

  if (reading.unlinkedOutwardDesire) {
    return {
      nature: 'manskling',
      origin: 'no_transformation_needed',
      believed,
      perceived: [],
      reason:
        'Lo que buscas esta fuera y por dentro no te falta nada. ' +
        'Convertirte no te daria lo que crees que te falta.',
      grounds,
      unsatisfied: false,
    };
  }

  if (reading.sufficiency && !reading.inwardDirection) {
    return {
      nature: 'manskling',
      origin: 'no_transformation_needed',
      believed,
      perceived: [],
      reason: 'No hay en ti una necesidad que exija transformarte.',
      grounds,
      unsatisfied: false,
    };
  }

  /**
   * Hay lectura de necesidad interna pero se sostiene en una sola evidencia.
   * Es el limite honesto: la lectura existe, pero una respuesta no es un perfil.
   */
  if (reading.innerNeedWithContent && support < 2) {
    return singleEvidenceReveal(profile, believed, perceived, grounds);
  }

  /**
   * Perfiles con direccion interna pero sin necesidad interna con contenido, o
   * con necesidad pero sin pauta de remediacion. Aqui el canon NO decide y la
   * evidencia NO alcanza. Se devuelve Manskling por lectura explicita de
   * "no hay evidencia de que necesites transformarte", NO por defecto.
   *
   * Esta es la lectura honesta para el caso hibrido abierto. No es una regla
   * que "solucione" el caso: es que no hay evidencia para decidirlo.
   */
  return {
    nature: 'manskling',
    origin: 'no_transformation_needed',
    believed,
    perceived,
    reason:
      'Hay algo tuyo que no acabas de entender, pero no hay evidencia de que necesites ' +
      'convertirte para resolverlo.',
    grounds,
    unsatisfied: perceived.some((e) => e.unresolved),
  };
}

/**
 * Perfil con una sola evidencia de necesidad interna, y nada mas.
 *
 * `misdirected_remedy` o `located_identity` solitarios. La lectura de necesidad
 * interna es real, pero una sola respuesta no sostiene una bendicion: es el
 * caso que el banco no cubre y que el motor no inventa.
 */
function singleEvidenceReveal(
  profile: InnerProfile,
  believed: readonly Evidence[],
  perceived: readonly Evidence[],
  grounds: readonly Evidence[],
): Revelation {
  return {
    nature: 'manskling',
    origin: 'no_transformation_needed',
    believed,
    perceived,
    reason:
      'Hay una cosa tuya que todavia no entiendes, pero es solo eso: una pieza suelta. ' +
      'No hay evidencia de que necesites transformarte para resolverla.',
    grounds,
    unsatisfied: perceived.some((e) => e.unresolved),
  };
}

function externalDesire(profile: InnerProfile): readonly Evidence[] {
  return (profile.byFamily['external_desire'] ?? []).filter((e) => !e.interpretiveAmbiguity);
}

/**
 * Evidencias internas que la Diosa puede nombrar.
 *
 * Las ambiguas EXCLUIDEN a proposito: no permiten afirmar que la necesidad sea
 * de un tipo concreto. Se pueden citar como "hay algo que no se formula".
 */
function innerEvidence(profile: InnerProfile): readonly Evidence[] {
  return (profile.byFamily['inner_search'] ?? []).concat(
    profile.byFamily['desire_vs_need'] ?? [],
  );
}

// ---------------------------------------------------------------------------
// Entrada publica
// ---------------------------------------------------------------------------

export interface GoddessInput {
  readonly evidence: readonly Evidence[];
  /** Lo que el canon dice de este reino. Vacio = el canon no decide. */
  readonly canonicalNature: readonly NatureId[];
}

export function interpretGoddess(input: GoddessInput): GoddessResult {
  const profile = buildProfile(input.evidence);
  const interpretation = interpret(profile);
  const revelation = reveal(profile, interpretation, input.canonicalNature);
  return { nature: revelation.nature, origin: revelation.origin, profile, interpretation, revelation };
}