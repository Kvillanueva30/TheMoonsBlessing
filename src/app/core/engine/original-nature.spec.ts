import { buildProfile, classifyNature, interpret, interpretGoddess, reveal } from './goddess.engine';
import { toEvidence, BankQuestion } from './evidence.adapter';
import { Evidence } from '../models/inner.model';
import questionsData from '../../../../data/questions/questions.json';
import bastia from '../../../../data/kingdoms/bastia.json';
import helia from '../../../../data/kingdoms/helia.json';
import tradia from '../../../../data/kingdoms/tradia.json';
import ederian from '../../../../data/kingdoms/ederian.json';

/**
 * NATURALEZA ORIGINAL VS NATURALEZA VIGENTE.
 *
 * El canon de Madar dice que la diosa transformo a TODOS los ciudadanos de
 * Bastia, Helia y Tradia despues de la guerra, sin importar si eran
 * Mansklings o Diubaks. El motor lo cumple con el cortocircuito del canon.
 *
 * Este spec comprueba las dos cosas por separado: que la vigente no cambia, y
 * que la original queda a la vista SIN sobrescribir nada.
 */

const bank = (questionsData as { questions: BankQuestion[] }).questions;
const perfil = bank.filter((p) => p.feedsProfile);

const MALDITOS = [bastia, helia, tradia] as unknown as {
  id: string;
  name: string;
  natures: readonly ('manskling' | 'diubak' | 'cazut')[];
  transformedByCurse?: boolean;
}[];
const MIXTOS = [ederian] as unknown as {
  id: string;
  name: string;
  natures: readonly ('manskling' | 'diubak' | 'cazut')[];
  transformedByCurse?: boolean;
}[];

/** Todas las combinaciones de respuesta del perfil, sin filtro. */
function* combinaciones(i: number, acc: Record<string, string>): Generator<Record<string, string>> {
  if (i === perfil.length) {
    yield { ...acc };
    return;
  }
  const q = perfil[i];
  for (const c of q.choices) {
    acc[q.id] = c.id;
    yield* combinaciones(i + 1, acc);
  }
}

/** El clasificador solo, sin canon. */
function soloClasificador(answers: Record<string, string>): 'manskling' | 'diubak' {
  const { evidence } = toEvidence(perfil);
  const chosen = evidence.filter((e: Evidence) => answers[e.questionId] === e.choiceId);
  const profile = buildProfile(chosen);
  return classifyNature(profile, interpret(profile)).nature;
}

describe('naturaleza original y vigente en los reinos malditos', () => {
  it('el dato declara la transformacion en los tres y no en los mixtos', () => {
    for (const r of MALDITOS) {
      expect(r.transformedByCurse).toBe(true);
      expect(r.natures).toEqual(['cazut']);
    }
    for (const r of MIXTOS) {
      expect(r.transformedByCurse).toBeUndefined();
      expect(r.natures.length).toBeGreaterThan(1);
    }
  });

  it('un Manskling original en Bastia, Helia o Tradia es Cazut hoy', () => {
    // Se recorren TODAS las combinaciones hasta encontrar una clasificada
    // como manskling, y se comprueba que en los tres sale cazut.
    let probadas = 0;
    for (const answers of combinaciones(0, {})) {
      if (soloClasificador(answers) !== 'manskling') continue;
      probadas++;
      for (const r of MALDITOS) {
        const { evidence } = toEvidence(perfil);
        const chosen = evidence.filter((e: Evidence) => answers[e.questionId] === e.choiceId);
        const res = interpretGoddess({
          evidence: chosen,
          canonicalNature: r.natures,
          historicalTransformation: r.transformedByCurse === true,
        });
        expect(res.nature).toBe('cazut');
        expect(res.originalNature.value).toBe('manskling');
        expect(res.transformed).toBe(true);
      }
      if (probadas >= 5) break;
    }
    expect(probadas).toBeGreaterThan(0);
  });

  it('un Diubak original en Bastia, Helia o Tradia es Cazut hoy', () => {
    let probadas = 0;
    for (const answers of combinaciones(0, {})) {
      if (soloClasificador(answers) !== 'diubak') continue;
      probadas++;
      for (const r of MALDITOS) {
        const { evidence } = toEvidence(perfil);
        const chosen = evidence.filter((e: Evidence) => answers[e.questionId] === e.choiceId);
        const res = interpretGoddess({
          evidence: chosen,
          canonicalNature: r.natures,
          historicalTransformation: r.transformedByCurse === true,
        });
        expect(res.nature).toBe('cazut');
        expect(res.originalNature.value).toBe('diubak');
        expect(res.transformed).toBe(true);
      }
      if (probadas >= 5) break;
    }
    expect(probadas).toBeGreaterThan(0);
  });

  it('la naturaleza original nunca es cazut: el clasificador no tiene esa salida', () => {
    for (const answers of combinaciones(0, {})) {
      expect(soloClasificador(answers)).not.toBe('cazut');
    }
  });

  it('un reino de naturaleza unica SIN transformacion no marca transformed', () => {
    const answers: Record<string, string> = {};
    for (const q of perfil) answers[q.id] = q.choices[0].id;
    const { evidence } = toEvidence(perfil);
    const chosen = evidence.filter((e: Evidence) => answers[e.questionId] === e.choiceId);

    // Mismo canon (cazut), pero SIN el dato de transformacion.
    const res = interpretGoddess({ evidence: chosen, canonicalNature: ['cazut'] });
    expect(res.nature).toBe('cazut');
    expect(res.transformed).toBe(false);
    expect(res.originalNature.source).toBe('inferred');
  });
});

describe('los reinos mixtos no cambian', () => {
  it('la vigente sigue siendo el veredicto del clasificador', () => {
    for (const answers of combinaciones(0, {})) {
      const { evidence } = toEvidence(perfil);
      const chosen = evidence.filter((e: Evidence) => answers[e.questionId] === e.choiceId);
      const canon = MIXTOS[0].natures;

      const res = interpretGoddess({ evidence: chosen, canonicalNature: canon });
      const profile = buildProfile(chosen);
      const esperado = classifyNature(profile, interpret(profile)).nature;

      expect(res.nature).toBe(esperado);
      expect(res.transformed).toBe(false);
      expect(res.originalNature.value).toBe(esperado);
    }
  });

  it('las tres naturalezas siguen siendo posibles en los mixtos', () => {
    // El canon de Ederian no incluye cazut: el clasificador no lo produce.
    // Lo que se comprueba es que manskling y diubak sigan siendo alcanzables.
    let man = 0;
    let diu = 0;
    for (const answers of combinaciones(0, {})) {
      const v = soloClasificador(answers);
      if (v === 'manskling') man++;
      else diu++;
    }
    expect(man).toBeGreaterThan(0);
    expect(diu).toBeGreaterThan(0);
  });
});

describe('el clasificador no altera las reglas ni los umbrales', () => {
  it('classifyNative y reveal coinciden sin canon', () => {
    for (const answers of combinaciones(0, {})) {
      const { evidence } = toEvidence(perfil);
      const chosen = evidence.filter((e: Evidence) => answers[e.questionId] === e.choiceId);
      const profile = buildProfile(chosen);
      const reading = interpret(profile);

      const clasificado = classifyNature(profile, reading);
      const viaReveal = reveal(profile, reading, []);

      expect(viaReveal.nature).toBe(clasificado.nature);
      expect(viaReveal.origin).toBe(clasificado.origin);
      expect(viaReveal.reason).toBe(clasificado.reason);
      expect(viaReveal.grounds).toEqual(clasificado.grounds);
      expect(viaReveal.unsatisfied).toBe(clasificado.unsatisfied);
    }
  });

  it('la necesidad interior sigue siendo independiente de la naturaleza vigente', () => {
    let conNecesidadYCazut = 0;
    let conNecesidadYManskling = 0;
    for (const answers of combinaciones(0, {})) {
      const { evidence } = toEvidence(perfil);
      const chosen = evidence.filter((e: Evidence) => answers[e.questionId] === e.choiceId);
      const profile = buildProfile(chosen);
      const reading = interpret(profile);
      if (!reading.innerNeedWithContent) continue;

      const viaReveal = reveal(profile, reading, []);
      if (viaReveal.nature === 'manskling') conNecesidadYManskling++;

      const maldito = interpretGoddess({
        evidence: chosen,
        canonicalNature: ['cazut'],
        historicalTransformation: true,
      });
      if (maldito.nature === 'cazut') conNecesidadYCazut++;
    }
    // La necesidad interior existe en los dos casos: no decide la vigente.
    expect(conNecesidadYManskling).toBeGreaterThan(0);
    expect(conNecesidadYCazut).toBeGreaterThan(0);
  });
});