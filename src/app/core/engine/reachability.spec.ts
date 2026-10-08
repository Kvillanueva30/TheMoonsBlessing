import { buildProfile, interpret, reveal } from './goddess.engine';
import { toEvidence, BankQuestion } from './evidence.adapter';
import { Evidence } from '../models/inner.model';
import questionsData from '../../../../data/questions/questions.json';

/**
 * MEDICION DE ALCANZABILIDAD.
 *
 * Recorre TODAS las combinaciones de las 4 preguntas que pueden bendecir y
 * cuenta que naturaleza sale. No es un test de correccion: es un test de
 * DISPONIBILIDAD. Si Diubak es inalcanzable, el test falla.
 *
 * Las 6 preguntas que no pueden bendecir se completan con su primera opcion
 * etiquetada. No sesga el resultado: canBless es false y el interprete las usa
 * solo como contexto.
 */

const bank = (questionsData as { questions: BankQuestion[] }).questions;
const perfil = bank.filter((p) => p.feedsProfile);

// Las preguntas que pueden bendecir, por id del banco actual.
const BLESS = ['q5', 'q6', 'q7', 'q9', 'q10'];

function medir() {
  const { evidence } = toEvidence(perfil);

  const byQuestion: Record<string, Evidence[]> = {};
  for (const e of evidence) {
    if (!byQuestion[e.questionId]) byQuestion[e.questionId] = [];
    byQuestion[e.questionId].push(e);
  }

  for (const p of perfil) {
    if (p.canBless === true) continue;
    const tagged = p.choices
      .filter((c) => c.evidence && c.evidence.status === 'APROBADO')
      .map((c) => c.evidence!)
      .map((tag, _i, _a) => evidence.find((e) => e.subtype === tag.subtype && e.questionId === p.id)!);
    if (tagged.length) byQuestion[p.id] = [tagged[0]];
  }

  const combos = BLESS.map((qid) => byQuestion[qid]);
  const contexto = perfil.filter((p) => p.canBless !== true).map((p) => byQuestion[p.id][0]);

  const tally: Record<string, number> = {};
  const lecturas: Record<string, number> = {};
  const ejemplos: string[][] = [];

  // Una vuelta por cada combinacion. El bucle es generico a proposito: asi el
  // banco puede crecer o cambiar de ids sin reescribir el spec entero.
  const recorrer = (nivel: number, acc: Evidence[]): void => {
    if (nivel === combos.length) {
      const profile = buildProfile([...acc, ...contexto]);
      const reading = interpret(profile);
      const rev = reveal(profile, reading, []);

      tally[rev.nature] = (tally[rev.nature] ?? 0) + 1;
      const key = `${reading.innerNeedWithContent ? 'necesidad' : 'sin necesidad'} + ${
        reading.remediationPattern ? 'remediacion' : 'sin remediacion'
      }`;
      lecturas[key] = (lecturas[key] ?? 0) + 1;

      if (rev.nature === 'diubak' && ejemplos.length < 5) {
        ejemplos.push(acc.map((e) => `${e.questionId}/${e.choiceId} ${e.subtype}`));
      }
      return;
    }
    for (const e of combos[nivel]) {
      recorrer(nivel + 1, [...acc, e]);
    }
  };
  recorrer(0, []);

  const total = combos.reduce((n, c) => n * c.length, 1);
  return { tally, lecturas, ejemplos, total };
}

describe('alcanzabilidad de la naturaleza', () => {
  const { tally, lecturas, ejemplos, total } = medir();

  it('el banco se adapta sin perder evidencia', () => {
    const { evidence, unlabelled } = toEvidence(perfil);
    expect(evidence.length).toBeGreaterThan(0);
    expect(unlabelled).toEqual([]);
  });

  it('ninguna pregunta del perfil tiene canBless sin decidir', () => {
    for (const p of perfil) {
      expect(typeof p.canBless).toBe('boolean');
    }
  });

  it('el reparto de las lecturas es el esperado', () => {
    // MEDIDO sobre las 768 combinaciones de las 5 preguntas decisivas
    // (q5, q6, q7, q9, q10) del banco de 10.
    //   sin necesidad + sin remediacion   288   37.5%
    //   necesidad    + sin remediacion      96   12.5%
    //   sin necesidad + remediacion       144   18.75%
    //   necesidad    + remediacion        240   31.25%  <- bendice
    //   naturaleza: manskling 81.25%  diubak 18.75%
    //
    // Antes de anadir q9 y q10 el banco daba 0% de Diubak: los subtipos
    // located_identity y misdirected_remedy no existian en ninguna pregunta.
    expect(lecturas['necesidad + remediacion']).toBe(240);
    expect(lecturas['necesidad + sin remediacion']).toBe(96);
    expect(tally['diubak']).toBe(144);
    expect(tally['manskling']).toBe(624);
  });

  it('Diubak es alcanzable', () => {
    expect(tally['diubak']).toBeGreaterThan(0);
  });

  it('Manskling es alcanzable', () => {
    expect(tally['manskling']).toBeGreaterThan(0);
  });

  it('hay varias lecturas distintas, no una sola', () => {
    expect(Object.keys(lecturas).length).toBeGreaterThanOrEqual(2);
  });
});