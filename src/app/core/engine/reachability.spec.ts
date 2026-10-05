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

const BLESS = ['b-002', 'b-003', 'b-004', 'i-004'];

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

  for (const a of combos[0])
    for (const b of combos[1])
      for (const c of combos[2])
        for (const d of combos[3]) {
          const chosen = [a, b, c, d];
          const profile = buildProfile([...chosen, ...contexto]);
          const reading = interpret(profile);
          const rev = reveal(profile, reading, []);

          tally[rev.nature] = (tally[rev.nature] ?? 0) + 1;
          const key = `${reading.innerNeedWithContent ? 'necesidad' : 'sin necesidad'} + ${
            reading.remediationPattern ? 'remediacion' : 'sin remediacion'
          }`;
          lecturas[key] = (lecturas[key] ?? 0) + 1;

          if (rev.nature === 'diubak' && ejemplos.length < 5) {
            ejemplos.push(chosen.map((e) => `${e.questionId}/${e.choiceId} ${e.subtype}`));
          }
        }

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
    // MEDIDO sobre las 896 combinaciones de las 4 preguntas decisivas.
    //   sin necesidad + sin remediacion   315   35.2%
    //   necesidad    + sin remediacion     189   21.1%   <- no bendice
    //   sin necesidad + remediacion        117   13.1%
    //   necesidad    + remediacion        275   30.7%   <- bendice
    //   naturaleza: manskling 81.03%  diubak 18.97%
    expect(lecturas['necesidad + remediacion']).toBe(275);
    expect(lecturas['necesidad + sin remediacion']).toBe(189);
    expect(tally['diubak']).toBe(170);
    expect(tally['manskling']).toBe(726);
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