/**
 *TIPOS DE LA CAPA INTERIOR.
 *
 * Son el contrato entre el banco de datos y el interprete de la Diosa.
 *
 * REGLA ESTRUCTURAL: estos tipos NO contienen reglas. Solo describen la forma.
 * Las reglas viven en data/lore-rules.json y las decisiones de la autora en
 * data/questions/questions.json (campo `canBless` de cada pregunta).
 *
 * En ningun punto de este archivo hay una regla del tipo
 * "subtipo X significa naturaleza Y". Los subtipos son EVIDENCIA SEMANTICA:
 * dicen que ha demostrado la persona con esa respuesta, no a que pertenece.
 */

// ---------------------------------------------------------------------------
// Identificadores
// ---------------------------------------------------------------------------

export type NatureId = 'manskling' | 'diubak' | 'cazut';

/**
 * Lo que el CLASIFICADOR puede devolver.
 *
 * Nunca 'cazut'. El clasificador lee respuestas del visitante, y ninguna
 * combinacion de respuestas significa "maldicion". El cazut no se infiere:
 * lo declara el canon del reino. Esa exclusion es deliberada y es lo que
 * impide inventar una naturaleza original cazut.
 */
export type InferredNature = 'manskling' | 'diubak';

/**
 * Como era la persona ANTES de una transformacion historica.
 *
 * SIEMPRE es una INFERENCIA del clasificador, jamas un dato historico
 * confirmado: el visitante no tiene un registro, solo unas respuestas. El
 * marcador `source` existe para que nadie en el futuro lo lea como un hecho
 * historico y lo use como base de otra regla.
 */
export interface OriginalNature {
  /** Veredicto del clasificador. Nunca 'cazut'. */
  readonly value: InferredNature;
  /** Siempre 'inferred'. Existe para dejarlo explicito. */
  readonly source: 'inferred';
}

export type OriginId = 'divine_blessing' | 'lineage' | 'curse' | 'no_transformation_needed';

export type EvidenceFamily =
  | 'sufficiency'
  | 'inner_search'
  | 'external_desire'
  | 'desire_vs_need'
  | 'relational_boundary'
  | 'character_only';

/**
 * Subtipos que la autora approveo uno a uno. Este union NO codifica ninguna
 * regla: solo garantiza que si el banco cambia, el compilador avise.
 */
export type EvidenceSubtype = string;

export type EvidenceDirection = 'inward' | 'outward' | 'none';

// ---------------------------------------------------------------------------
// Evidencia
// ---------------------------------------------------------------------------

/**
 * UNA evidencia es la lectura de UNA respuesta del visitante.
 *
 * Nunca se agrega evidencia que no venga de una respuesta real. El
 * interprete no puede inferir, suponer ni completar.
 */
export interface Evidence {
  readonly questionId: string;
  readonly choiceId: string;
  /** Texto literal que eligio el visitante. Es la unica prosa citable. */
  readonly text: string;

  readonly family: EvidenceFamily;
  readonly subtype: EvidenceSubtype;
  readonly direction: EvidenceDirection;

  /**
   * unresolved: la persona NO tiene claro lo que esta experimentando.
   * verified: la persona YA VIVIO esa experiencia (es contexto temporal).
   *
   * Ninguno de los dos es un indicador de naturaleza. verified:false esta
   * ABIERTO como regla global y no se usa para decidir nada aqui.
   */
  readonly unresolved: boolean;
  readonly verified: boolean;

  /**
   * AdmitE mas de una lectura. NO invalida la evidencia: gobierna que puede
   * afirmar la revelacion. Una evidencia ambigua puede entrar en `grounds`
   * como "hay algo que no se formula" y NUNCA como "hay una necesidad interna".
   */
  readonly interpretiveAmbiguity: boolean;

  /** No sostiene sola una conclusion especifica. */
  readonly aloneInsufficient: boolean;

  /** true si su pregunta tiene canBless:true. Se lee del dato. */
  readonly questionCanBless: boolean;

  /** Lo que esta evidencia demuestra, sin nombres de personajes. */
  readonly lee: string;
}

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------

/**
 * innerProfile: el conjunto completo de evidencias.
 *
 * NO lleva ninguna puntuacion, ningun total y ninguna clasificacion. Es solo
 * el conjunto de lo que la persona respondio, agrupado por familia.
 *
 * Puede existir perfectamente sin producir naturaleza: un perfil es un
 * conjunto de observaciones, no un veredicto.
 */
export interface InnerProfile {
  /** Todas las evidencias de las preguntas que pueden bendecir. */
  readonly blessingEvidence: readonly Evidence[];
  /** Todas las evidencias de las preguntas que no pueden. Contexto. */
  readonly contextEvidence: readonly Evidence[];

  readonly byFamily: Readonly<Record<EvidenceFamily, readonly Evidence[]>>;
  readonly bySubtype: Readonly<Record<string, readonly Evidence[]>>;
}

// ---------------------------------------------------------------------------
// Interpretacion
// ---------------------------------------------------------------------------

/**
 * La lectura global de la Diosa sobre el perfil.
 *
 * Son observaciones cualitativas. Ninguna es un score.
 */
export interface Interpretation {
  /**
   * Hay una necesidad interna que la persona NO puede resolver sola.
   * Se apoya unicamente en evidencias con contenido (located_identity,
   * misdirected_remedy) y que NO son aloneInsufficient.
   */
  readonly innerNeedWithContent: boolean;

  /**
   * Hay una pauta de remediacion: la persona esta haciendo ALGO para
   * resolver lo que siente. evidenced por haber intentado y fallado, o
   * por haber decidido ya que va a cambiar.
   *
   * Esto NO es "sabe que tiene un problema". Es "esta actuando sobre el".
   */
  readonly remediationPattern: boolean;

  /**
   * La persona reconoce que lo que busca no esta fuera. No dice que necesite
   * transformarse: dice la DIRECCION. Es dimension, no veredicto.
   */
  readonly inwardDirection: boolean;

  /**
   * El deseo apunta hacia fuera y NO esta unido a ninguna necesidad interna.
   * Es el caso de Benny: Quiere algo fuera y no le falta nada por dentro.
   */
  readonly unlinkedOutwardDesire: boolean;

  /**
   * Suficiencia: evidencia de que no necesita transformarse. No es moralidad.
   */
  readonly sufficiency: boolean;
}

// ---------------------------------------------------------------------------
// Revelation
// ---------------------------------------------------------------------------

/**
 * Lo que la Diosa revela.
 *
 * grounds es la LISTA BLANCA: el compositor de texto solo puede afirmar cosas
 * apoyadas en evidencias que estan aqui. Si grounds esta vacio, la revelacion
 * no puede afirmar nada especifico.
 */
export interface Revelation {
  /** Naturaleza VIGENTE: lo que la persona es hoy, ya con el canon aplicado. */
  readonly nature: NatureId;
  /** Como era segun el clasificador, antes de cualquier transformacion. */
  readonly originalNature: OriginalNature;
  /**
   * true SOLO si hubo una transformacion historica canonica real: el dato del
   * reino lo declara y la naturaleza vigente es cazut. No significa "el reino
   * tiene una sola naturaleza", ni nada sobre moralidad.
   */
  readonly transformed: boolean;
  readonly origin: OriginId;

  /** 1. Lo que la persona CREE querer. Evidencias de deseo externo. */
  readonly believed: readonly Evidence[];

  /** 2. Lo que la Diosa PERCIBE que realmente necesita. Evidencias internas. */
  readonly perceived: readonly Evidence[];

  /** 3. Por que una bendicion tendria sentido, o por que no. */
  readonly reason: string;

  /** Evidencias reales que sostienen la revelacion. Lista blanca. */
  readonly grounds: readonly Evidence[];

  /** La persona NO lo sabe todavia. */
  readonly unsatisfied: boolean;
}

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------

export interface GoddessResult {
  /** Naturaleza vigente. Es la que se muestra como resultado. */
  readonly nature: NatureId;
  /** Como era segun el clasificador, antes de una transformacion canonica. */
  readonly originalNature: OriginalNature;
  /** true solo ante una transformacion historica canonica real. */
  readonly transformed: boolean;
  readonly origin: OriginId;
  readonly profile: InnerProfile;
  readonly interpretation: Interpretation;
  readonly revelation: Revelation;
}