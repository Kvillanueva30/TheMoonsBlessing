import { interpretGoddess, GoddessInput } from './goddess.engine';
import {
  Evidence,
  EvidenceDirection,
  EvidenceFamily,
  NatureId,
} from '../models/inner.model';

/**
 * FIXTURES DE COMPORTAMIENTO.
 *
 * Los personajes canonicos son SOLO una forma de comprobar que el interprete
 * lee correctamente un perfil. La arquitectura NO depende de sus nombres: son
 * conjuntos de evidencia, y el motor nunca los mira.
 *
 * Si el interprete bumpease un caso porque reconociera un nombre, estos tests
 * fallarian. Ningun nombre entra en el motor.
 */

interface EvSpec {
  readonly questionId: string;
  readonly choiceId: string;
  readonly text: string;
  readonly family: EvidenceFamily;
  readonly subtype: string;
  readonly direction: EvidenceDirection;
  readonly unresolved?: boolean;
  readonly verified?: boolean;
  readonly interpretiveAmbiguity?: boolean;
  readonly aloneInsufficient?: boolean;
  readonly canBless: boolean;
}

/** Las 4 preguntas que si pueden bendecir. */
const CAN_BLESS = new Set(['b-002', 'b-003', 'b-004', 'i-004']);

function evidence(specs: readonly EvSpec[]): Evidence[] {
  return specs.map((s) => ({
    questionId: s.questionId,
    choiceId: s.choiceId,
    text: s.text,
    family: s.family,
    subtype: s.subtype,
    direction: s.direction,
    unresolved: s.unresolved ?? false,
    verified: s.verified ?? true,
    interpretiveAmbiguity: s.interpretiveAmbiguity ?? false,
    aloneInsufficient: s.aloneInsufficient ?? false,
    questionCanBless: s.canBless || CAN_BLESS.has(s.questionId),
    lee: s.text,
  }));
}

function run(specs: readonly EvSpec[], canonical: NatureId[] = []) {
  return interpretGoddess({ evidence: evidence(specs), canonicalNature: canonical });
}

// ---------------------------------------------------------------------------
// Fixture: suficiente por dentro, sin necesidad interna
// ---------------------------------------------------------------------------

const SUFFICIENT: EvSpec[] = [
  { questionId: 'b-002', choiceId: 'a', text: 'Nada. De verdad nada.', family: 'sufficiency', subtype: 'complete_present', direction: 'none', canBless: true },
  { questionId: 'b-003', choiceId: 'b', text: 'Lo dejo pasar. Soy quien soy y me llega.', family: 'sufficiency', subtype: 'complete_present', direction: 'none', canBless: true },
  { questionId: 'b-004', choiceId: 'b', text: 'No lo necesito. Debe haber otra manera.', family: 'sufficiency', subtype: 'complete_present', direction: 'none', canBless: true },
  { questionId: 'i-004', choiceId: 'd', text: 'Nada. Ya soy quien quiero ser.', family: 'character_only', subtype: 'identity_continuity', direction: 'none', canBless: true },
  { questionId: 'i-005', choiceId: 'f', text: 'Me da igual lo que vea. Ya lo sé yo.', family: 'external_desire', subtype: 'audience_independence', direction: 'none', canBless: false },
];

// ---------------------------------------------------------------------------
// Fixture: deseo externo fuerte, sin necesidad interna
// ---------------------------------------------------------------------------

const EXTERNAL_WITHOUT_INNER: EvSpec[] = [
  { questionId: 'b-002', choiceId: 'b', text: 'Más reconocimiento. Es lo único que me falta.', family: 'external_desire', subtype: 'recognition', direction: 'outward', verified: false, canBless: true },
  { questionId: 'b-003', choiceId: 'a', text: 'Lo tomo. Es el trato que quería.', family: 'external_desire', subtype: 'transformation_status', direction: 'outward', verified: false, canBless: true },
  { questionId: 'b-004', choiceId: 'a', text: 'Lo uso y lo resuelvo. Era exactamente lo que hacía falta.', family: 'sufficiency', subtype: 'complete_present', direction: 'none', canBless: true },
  { questionId: 'i-004', choiceId: 'a', text: 'La paz. Todos esos años de tranquilidad.', family: 'character_only', subtype: 'peace_as_priority', direction: 'none', canBless: true },
  { questionId: 'i-003', choiceId: 'f', text: 'Que me digan. Mientras no lo diga nadie, no es así.', family: 'desire_vs_need', subtype: 'validation_needed', direction: 'outward', unresolved: true, verified: false, interpretiveAmbiguity: true, aloneInsufficient: true, canBless: false },
];

// ---------------------------------------------------------------------------
// Fixture: necesidad interna con contenido y pauta de remediacion
// ---------------------------------------------------------------------------

const INNER_WITH_CONTENT: EvSpec[] = [
  { questionId: 'b-002', choiceId: 'f', text: 'Lo que busco no está en ninguna parte de fuera.', family: 'desire_vs_need', subtype: 'inward_declared', direction: 'inward', unresolved: true, canBless: true },
  { questionId: 'b-003', choiceId: 'c', text: 'Lo tomo. Y descubro que el que era tampoco me bastaba.', family: 'inner_search', subtype: 'located_identity', direction: 'inward', unresolved: true, canBless: true },
  { questionId: 'b-004', choiceId: 'c', text: 'Lo tomo. Y luego descubro que el problema era otro.', family: 'inner_search', subtype: 'misdirected_remedy', direction: 'outward', unresolved: true, canBless: true },
  { questionId: 'i-004', choiceId: 'f', text: 'A mi libertad. Ya lo sé.', family: 'desire_vs_need', subtype: 'inward_declared', direction: 'inward', unresolved: false, canBless: true },
  { questionId: 'i-001', choiceId: 'e', text: 'Falta algo. Lo noto en el cuerpo.', family: 'inner_search', subtype: 'unformulable', direction: 'none', unresolved: true, interpretiveAmbiguity: true, aloneInsufficient: true, canBless: false },
];

// ---------------------------------------------------------------------------
// Fixture: ambiguedad que NO debe producir necesidad interna
// ---------------------------------------------------------------------------

const FORMESS_EMPTINESS: EvSpec[] = [
  { questionId: 'b-002', choiceId: 'c', text: 'No sabría decirlo. Hay algo dentro que no logro alcanzar.', family: 'inner_search', subtype: 'unlocated', direction: 'inward', unresolved: true, interpretiveAmbiguity: true, aloneInsufficient: true, canBless: true },
  { questionId: 'b-003', choiceId: 'd', text: 'Lo tomo. Necesito que alguien me diga que valgo.', family: 'desire_vs_need', subtype: 'validation_needed', direction: 'outward', canBless: true },
  { questionId: 'b-004', choiceId: 'b', text: 'No lo necesito.', family: 'sufficiency', subtype: 'complete_present', direction: 'none', canBless: true },
  { questionId: 'i-004', choiceId: 'b', text: 'No lo sé todavía.', family: 'character_only', subtype: 'undecided', direction: 'none', unresolved: true, verified: false, canBless: true },
];

// ===========================================================================

describe('buildProfile', () => {
  it('separa lo que puede bendecir del contexto', () => {
    const r = run(INNER_WITH_CONTENT);
    expect(r.profile.blessingEvidence.length).toBe(4);
    expect(r.profile.contextEvidence.length).toBe(1);
  });

  it('agrupa por familia y por subtipo', () => {
    const r = run(INNER_WITH_CONTENT);
    expect(r.profile.byFamily['desire_vs_need'].length).toBe(2);
    expect(r.profile.byFamily['inner_search'].length).toBe(2);
    expect(r.profile.bySubtype['inward_declared'].length).toBe(2);
    expect(r.profile.bySubtype['located_identity'].length).toBe(1);
  });

  it('un perfil puede existir sin producir ninguna naturaleza interpretable', () => {
    // Un perfil es un conjunto de observaciones, no un veredicto.
    const r = run(FORMESS_EMPTINESS);
    expect(r.profile.blessingEvidence.length).toBeGreaterThan(0);
    expect(r.interpretation.innerNeedWithContent).toBe(false);
  });
});

describe('interpret', () => {
  it('suficiencia por dentro: ninguna necesidad interna, ninguna remediacion', () => {
    const r = run(SUFFICIENT);
    expect(r.interpretation.innerNeedWithContent).toBe(false);
    expect(r.interpretation.remediationPattern).toBe(false);
    expect(r.interpretation.inwardDirection).toBe(false);
    expect(r.interpretation.sufficiency).toBe(true);
  });

  it('deseo externo sin necesidad interna: periamente', () => {
    const r = run(EXTERNAL_WITHOUT_INNER);
    expect(r.interpretation.innerNeedWithContent).toBe(false);
    expect(r.interpretation.unlinkedOutwardDesire).toBe(true);
    expect(r.interpretation.sufficiency).toBe(true);
  });

  it('necesidad interna con contenido: la tiene', () => {
    const r = run(INNER_WITH_CONTENT);
    expect(r.interpretation.innerNeedWithContent).toBe(true);
    expect(r.interpretation.remediationPattern).toBe(true);
    expect(r.interpretation.inwardDirection).toBe(true);
  });

  it('un vacio sin contenido NO produce necesidad interna aunque la pregunta pueda bendecir', () => {
    const r = run(FORMESS_EMPTINESS);
    // b-002/c es unlocated + ambigua + aloneInsufficient
    expect(r.interpretation.innerNeedWithContent).toBe(false);
    expect(r.interpretation.remediationPattern).toBe(false);
  });

  it('respecta aloneInsufficient: unlocated no cuenta como necesidad', () => {
    const specs: EvSpec[] = [
      { questionId: 'b-002', choiceId: 'e', text: 'Solo que se me escapa el nombre.', family: 'inner_search', subtype: 'unformulable', direction: 'none', unresolved: true, interpretiveAmbiguity: true, canBless: true },
      { questionId: 'b-003', choiceId: 'd', text: 'Necesito que alguien me diga que valgo.', family: 'desire_vs_need', subtype: 'validation_needed', direction: 'outward', canBless: true },
    ];
    const r = run(specs);
    expect(r.interpretation.innerNeedWithContent).toBe(false);
  });
});

describe('reveal — el canon manda', () => {
  it('un reino con naturaleza canonica la devuelve sin importar el perfil', () => {
    // Perfil que SIN la interpretacion seria Diubak.
    const r = run(INNER_WITH_CONTENT, ['cazut']);
    expect(r.nature).toBe('cazut');
    expect(r.origin).toBe('curse');
  });

  it('el origen de la maldicion es curse, no una decision interior', () => {
    const r = run(SUFFICIENT, ['cazut']);
    expect(r.origin).toBe('curse');
  });

  it('el interprete psicologico no puede sobrescribir el canon', () => {
    // Mismo perfil, dos常识 de reino: el perfil no cambia el resultado.
    const conCanon = run(INNER_WITH_CONTENT, ['cazut']);
    const sinCanon = run(INNER_WITH_CONTENT, []);
    expect(conCanon.nature).not.toBe(sinCanon.nature);
  });
});

describe('reveal — por el conjunto del perfil', () => {
  it('necesidad interna con contenido + remediacion', () => {
    const r = run(INNER_WITH_CONTENT);
    expect(r.nature).toBe('diubak');
    expect(r.origin).toBe('divine_blessing');
  });

  it('suficiencia sin direccion interna', () => {
    const r = run(SUFFICIENT);
    expect(r.nature).toBe('manskling');
    expect(r.origin).toBe('no_transformation_needed');
  });

  it('deseo externo sin necesidad interna enlazada', () => {
    const r = run(EXTERNAL_WITHOUT_INNER);
    expect(r.nature).toBe('manskling');
    expect(r.origin).toBe('no_transformation_needed');
  });

  it('vacio sin contenido no produce Diubak', () => {
    const r = run(FORMESS_EMPTINESS);
    expect(r.nature).not.toBe('diubak');
  });

  it('no hay ninguna regla de subtipo a naturaleza', () => {
    // Ningun subtipo por si solo produce Diubak. Se prueba retirando uno a uno.
    const soloInward = run([
      { questionId: 'b-002', choiceId: 'f', text: 'No está en ninguna parte de fuera.', family: 'desire_vs_need', subtype: 'inward_declared', direction: 'inward', unresolved: true, canBless: true },
    ]);
    expect(soloInward.nature).not.toBe('diubak');

    const soloLocated = run([
      { questionId: 'b-003', choiceId: 'c', text: 'El que era tampoco me bastaba.', family: 'inner_search', subtype: 'located_identity', direction: 'inward', unresolved: true, canBless: true },
    ]);
    expect(soloLocated.nature).not.toBe('diubak');

    const soloMisdirected = run([
      { questionId: 'b-004', choiceId: 'c', text: 'El problema era otro.', family: 'inner_search', subtype: 'misdirected_remedy', direction: 'outward', unresolved: true, canBless: true },
    ]);
    expect(soloMisdirected.nature).not.toBe('diubak');
  });
});

describe('revelation', () => {
  it('grounds solo contiene evidencia real del perfil', () => {
    const r = run(INNER_WITH_CONTENT);
    const reales = new Set(evidence(INNER_WITH_CONTENT).map((e) => `${e.questionId}/${e.choiceId}`));
    for (const g of r.revelation.grounds) {
      expect(reales.has(`${g.questionId}/${g.choiceId}`)).toBe(true);
    }
  });

  it('grounds nunca incluye evidencia de preguntas que no pueden bendecir', () => {
    const r = run(INNER_WITH_CONTENT);
    for (const g of r.revelation.grounds) {
      expect(g.questionCanBless).toBe(true);
    }
  });

  it('perceived solo contiene evidencia interna no ambigua', () => {
    const r = run(INNER_WITH_CONTENT);
    expect(r.revelation.perceived.length).toBeGreaterThan(0);
    for (const p of r.revelation.perceived) {
      expect(['inner_search', 'desire_vs_need']).toContain(p.family);
      expect(p.interpretiveAmbiguity).toBe(false);
    }
  });

  it('believed contiene el deseo externo', () => {
    const r = run(EXTERNAL_WITHOUT_INNER);
    expect(r.revelation.believed.length).toBeGreaterThan(0);
    for (const b of r.revelation.believed) expect(b.family).toBe('external_desire');
  });

  it('la revelacion de Diubak dice que hay una necesidad sin resolver', () => {
    const r = run(INNER_WITH_CONTENT);
    expect(r.revelation.reason).toContain('no logras resolver');
  });

  it('la revelacion de suficiencia NO dice que la persona sea buena', () => {
    const r = run(SUFFICIENT);
    expect(r.revelation.reason).not.toContain('buena');
    expect(r.revelation.reason).not.toContain('mala');
    expect(r.revelation.reason).toContain('No hay en ti una necesidad');
  });

  it('la revelacion de deseo externo explica que transformarse no lo daria', () => {
    const r = run(EXTERNAL_WITHOUT_INNER);
    expect(r.revelation.reason).toContain('no te daria');
  });

  it('unsatisfied refleja si la persona tiene claro lo que le pasa', () => {
    const con = run(INNER_WITH_CONTENT);
    // Ambas evidencias RESUELTAS: la persona sabe lo que le pasa.
    const sin = run([
      { questionId: 'b-003', choiceId: 'c', text: 'El que era tampoco me bastaba.', family: 'inner_search', subtype: 'located_identity', direction: 'inward', unresolved: false, canBless: true },
      { questionId: 'b-004', choiceId: 'c', text: 'El problema era otro.', family: 'inner_search', subtype: 'misdirected_remedy', direction: 'outward', unresolved: false, canBless: true },
    ]);
    expect(con.revelation.unsatisfied).toBe(true);
    expect(sin.revelation.unsatisfied).toBe(false);
  });
});

describe('el canon no premia moralidad', () => {
  it('un perfil generoso sin necesidad interna no produce Diubak', () => {
    const generoso: EvSpec[] = [
      // deber por otros, sacrificio, notwithstanding: nada de necesidad interna
      { questionId: 'b-005', choiceId: 'a', text: 'Lo hago. Hay cosas que no negocio.', family: 'character_only', subtype: 'moral_limit', direction: 'none', canBless: false },
      { questionId: 'b-001', choiceId: 'd', text: 'Lo aceptas para proteger a los tuyos.', family: 'character_only', subtype: 'duty_for_others', direction: 'none', canBless: false },
      { questionId: 'b-002', choiceId: 'a', text: 'Nada. De verdad nada.', family: 'sufficiency', subtype: 'complete_present', direction: 'none', canBless: true },
      { questionId: 'b-003', choiceId: 'b', text: 'Soy quien soy y me llega.', family: 'sufficiency', subtype: 'complete_present', direction: 'none', canBless: true },
    ];
    expect(run(generoso).nature).toBe('manskling');
  });

  it('un perfil cruel con necesidad interna SÍ puede ser Diubak', () => {
    const cruel: EvSpec[] = [
      { questionId: 'b-002', choiceId: 'f', text: 'No está en ninguna parte de fuera.', family: 'desire_vs_need', subtype: 'inward_declared', direction: 'inward', unresolved: true, canBless: true },
      { questionId: 'b-003', choiceId: 'c', text: 'El que era tampoco me bastaba.', family: 'inner_search', subtype: 'located_identity', direction: 'inward', unresolved: true, canBless: true },
      { questionId: 'b-004', choiceId: 'c', text: 'El problema era otro.', family: 'inner_search', subtype: 'misdirected_remedy', direction: 'outward', unresolved: true, canBless: true },
      { questionId: 'l-008', choiceId: 'c', text: 'Lo uso cuando me conviene.', family: 'character_only', subtype: 'impulsive_act', direction: 'none', canBless: false },
    ];
    expect(run(cruel).nature).toBe('diubak');
  });
});

describe('el caso hibrido abierto', () => {
  it('deseo externo + direccion interna sin necesidad con contenido', () => {
    // Este perfil NO esta cubierto por el canon. El motor no lo inventa.
    const hibrido: EvSpec[] = [
      { questionId: 'b-002', choiceId: 'f', text: 'No está en ninguna parte de fuera.', family: 'desire_vs_need', subtype: 'inward_declared', direction: 'inward', unresolved: true, canBless: true },
      { questionId: 'b-003', choiceId: 'a', text: 'Lo tomo. Es el trato que quería.', family: 'external_desire', subtype: 'transformation_status', direction: 'outward', verified: false, canBless: true },
      { questionId: 'b-004', choiceId: 'b', text: 'No lo necesito.', family: 'sufficiency', subtype: 'complete_present', direction: 'none', canBless: true },
    ];
    const r = run(hibrido);
    // No hay necesidad interna CON CONTENIDO. No puede entrar por la via de la bendicion.
    expect(r.interpretation.innerNeedWithContent).toBe(false);
    expect(r.nature).toBe('manskling');
    // Y NO puede decir "por dentro no te falta nada": la persona declaro direccion interna.
    expect(r.revelation.reason).not.toContain('no te falta nada');
    expect(r.revelation.reason).toContain('no hay evidencia');
  });
});