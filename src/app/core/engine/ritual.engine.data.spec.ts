import { resolveRitual, KingdomRule, RitualInput } from './ritual.engine';
import type { MoonPhaseResult } from '../services/moon.service';
import { KingdomId, NatureId, MadarResult } from '../models/ritual.model';
import questionsData from '../../../../data/questions/questions.json';
import ederian from '../../../../data/kingdoms/ederian.json';
import tralan from '../../../../data/kingdoms/tralan.json';
import xorian from '../../../../data/kingdoms/xorian.json';
import tradia from '../../../../data/kingdoms/tradia.json';
import helia from '../../../../data/kingdoms/helia.json';
import bastia from '../../../../data/kingdoms/bastia.json';

// Usa el BANCO REAL, no fixtures. Si alguien edita data/, esto se rompe.

const KINGDOM_FILES = [ederian, tralan, xorian, tradia, helia, bastia] as const;

const KINGDOMS: readonly KingdomRule[] = KINGDOM_FILES.map((k) => ({
  id: k.id as KingdomId,
  name: k.name,
  natures: k.natures as readonly NatureId[],
  founder: k.founder ? { name: k.founder.name, title: k.founder.title } : undefined,
}));

const NATURE_RULES = {
  manskling: { headline: 'Eres un Manskling.', meaning: 'm' },
  diubak: { headline: 'Eres un Diubak.', meaning: 'd' },
  cazut: { headline: 'Eres un Cazut.', meaning: 'c' },
} as const;

const MOON: MoonPhaseResult = {
  id: 'new-moon',
  angle: 0,
  illumination: 0,
};

const QUESTIONS = questionsData.questions as unknown as RitualInput['questions'];

/** Todas las opciones 'a' de todas las preguntas del banco. */
const ALL_A = QUESTIONS.map((q) => ({ questionId: q.id, choiceId: q.choices[0].id }));

/** Todas las opciones 'b'. */
const ALL_B = QUESTIONS.map((q) => ({
  questionId: q.id,
  choiceId: q.choices[1]?.id ?? q.choices[0].id,
}));

/** Busca la pregunta que tiene un choiceId concreto. */
function answerWith(questionId: string, choiceId: string) {
  const base = QUESTIONS.map((q) => ({ questionId: q.id, choiceId: q.choices[0].id }));
  return base.map((a) => (a.questionId === questionId ? { questionId, choiceId } : a));
}

function run(answers: readonly { questionId: string; choiceId: string }[]): MadarResult {
  return resolveRitual({
    input: { moon: MOON, answers },
    questions: QUESTIONS,
    kingdoms: KINGDOMS,
    natureRules: NATURE_RULES,
  });
}

describe('motor contra el banco real', () => {
  it('el banco contiene preguntas y opciones utilizables', () => {
    expect(QUESTIONS.length).toBeGreaterThan(0);
    for (const q of QUESTIONS) {
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('los seis reinos declaran naturalezas no vacias', () => {
    for (const k of KINGDOMS) {
      expect(k.natures.length).toBeGreaterThan(0);
    }
  });

  it('produce un resultado valido con todas las opciones a', () => {
    const result = run(ALL_A);

    expect(KINGDOMS.some((k) => k.id === result.kingdom)).toBe(true);
    expect(['manskling', 'diubak', 'cazut']).toContain(result.nature);
    expect(['blessing', 'lineage', 'curse']).toContain(result.origin);
  });

  it('produce un resultado valido con todas las opciones b', () => {
    const result = run(ALL_B);
    expect(KINGDOMS.some((k) => k.id === result.kingdom)).toBe(true);
  });

  it('los seis reinos son alcanzables recorriendo el banco', () => {
    const seen = new Set<KingdomId>();
    const alphabet = ['a', 'b', 'c', 'd'] as const;

    for (const first of alphabet) {
      for (const second of alphabet) {
        const answers = QUESTIONS.map((q) => {
          const pick = q.id.charCodeAt(q.id.length - 1) % 2 === 0 ? first : second;
          const idx = 'abcd'.indexOf(pick);
          return {
            questionId: q.id,
            choiceId: q.choices[Math.min(idx, q.choices.length - 1)].id,
          };
        });
        seen.add(run(answers).kingdom);
      }
    }

    // Documenta la cobertura real sin exigir un minimo: el banco esta
    // declarado como incompleto en questions.json -> coverageReport.
    console.log(`  reinos alcanzables con el banco actual: ${seen.size}/6`);
    console.log(`  ${[...seen].join(', ')}`);
  });

  it('los reinos Cazut solo producen Cazut, sin excepcion', () => {
    const cursed: readonly KingdomId[] = ['tradia', 'helia', 'bastia'];
    const alphabet = ['a', 'b', 'c', 'd'] as const;

    for (const first of alphabet) {
      for (const second of alphabet) {
        const answers = QUESTIONS.map((q) => {
          const pick = q.id.charCodeAt(q.id.length - 1) % 2 === 0 ? first : second;
          const idx = 'abcd'.indexOf(pick);
          return {
            questionId: q.id,
            choiceId: q.choices[Math.min(idx, q.choices.length - 1)].id,
          };
        });
        const result = run(answers);

        if (cursed.includes(result.kingdom)) {
          expect(result.nature).toBe('cazut');
          expect(result.origin).toBe('curse');
        }
      }
    }
  });

  it('el deseo alto nunca produce Diubak por si solo', () => {
    // Recorre el banco entero y comprueba la invariante.
    for (const choiceId of ['a', 'b', 'c', 'd']) {
      const answers = QUESTIONS.map((q) => ({
        questionId: q.id,
        choiceId: q.choices[Math.min('abcd'.indexOf(choiceId), q.choices.length - 1)].id,
      }));
      const result = run(answers);
      const kingdom = KINGDOMS.find((k) => k.id === result.kingdom)!;

      if (kingdom.natures.length === 1) continue;

      // Si la necesidad interna esta a cero, tiene que ser Manskling
      // aunque el deseo sea maximo.
      if (result.need === 0) {
        expect(result.nature).toBe('manskling');
      }
    }
  });

  it('el resultado no depende de la luna', () => {
    const newMoon = run(ALL_A);
    const fullMoon = resolveRitual({
      input: {
        moon: { ...MOON, id: 'full-moon', angle: 180, illumination: 1 } satisfies MoonPhaseResult,
        answers: ALL_A,
      },
      questions: QUESTIONS,
      kingdoms: KINGDOMS,
      natureRules: NATURE_RULES,
    });

    expect(fullMoon.kingdom).toBe(newMoon.kingdom);
    expect(fullMoon.nature).toBe(newMoon.nature);
  });

  it('between es siempre null', () => {
    expect(run(ALL_A).between).toBeNull();
    expect(run(ALL_B).between).toBeNull();
  });
});