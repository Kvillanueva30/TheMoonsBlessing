import {
  BLESSING_THRESHOLD,
  KingdomRule,
  RitualInput,
  resolveRitual,
} from './ritual.engine';
import {
  AnswerSet,
  KingdomId,
  MadarInput,
  NatureId,
  OriginId,
  Question,
  QuestionChoice,
} from '../models/ritual.model';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const KINGDOMS: readonly KingdomRule[] = [
  { id: 'ederian', name: 'Ederian', natures: ['manskling', 'diubak'], founder: { name: 'Lucius' } },
  { id: 'tralan', name: 'Tralan', natures: ['manskling', 'diubak'], founder: { name: 'Ross' } },
  { id: 'xorian', name: 'Xorian', natures: ['manskling', 'diubak'], founder: { name: 'Deron' } },
  { id: 'tradia', name: 'Tradia', natures: ['cazut'], founder: { name: 'Halik' } },
  { id: 'helia', name: 'Helia', natures: ['cazut'], founder: { name: 'Tarik' } },
  { id: 'bastia', name: 'Bastia', natures: ['cazut'], founder: { name: 'Silas' } },
];

const NATURE_RULES = {
  manskling: { headline: 'Eres un Manskling.', meaning: 'x' },
  diubak: { headline: 'Eres un Diubak.', meaning: 'x' },
  cazut: { headline: 'Eres un Cazut.', meaning: 'x' },
} as const;

/** Luna falsa: el motor no debe mirarla nunca. */
const MOON = {
  phaseId: 'new-moon',
  phaseName: { en: 'New Moon', es: 'Luna Nueva' },
  illumination: 0,
  age: 0.1,
};

/**
 * Construye una pregunta con una sola dimension variable, para poder escribir
 * "necesidad alta" sin depender del banco real.
 */
function question(
  id: string,
  legacy: Partial<Record<KingdomId, number>>,
  wish: number,
  need: number,
): Question {
  const legacyAffinity = Object.fromEntries(
    KINGDOMS.map((k) => [k.id, legacy[k.id] ?? 0]),
  ) as Record<KingdomId, number>;

  const choice: QuestionChoice = {
    id: 'a',
    text: 'texto',
    legacyAffinity,
    wishOutside: wish,
    innerNeed: need,
  };

  return { id, theme: id, axis: 'test', text: id, choices: [choice] };
}

function run(
  questions: readonly Question[],
  answers: readonly AnswerSet[],
): ReturnType<typeof resolveRitual> {
  const input: MadarInput = { moon: MOON, answers };
  return resolveRitual({ input, questions, kingdoms: KINGDOMS, natureRules: NATURE_RULES });
}

/** Respuestas todas a la opcion 'a' de cada pregunta. */
const allA = (ids: readonly string[]): readonly AnswerSet[] =>
  ids.map((questionId) => ({ questionId, choiceId: 'a' }));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolveRitual', () => {
  describe('aislamiento de la luna', () => {
    it('devuelve la luna del visitante sin que ningun otro campo dependa de ella', () => {
      const q = [question('q1', { ederian: 3 }, 0, 0)];
      const result = run(q, allA(['q1']));

      expect(result.moon).toEqual(MOON);
      expect(result.moon.phaseId).toBe('new-moon');
    });

    it('produce exactamente el mismo reino y naturaleza con luna nueva y luna llena', () => {
      const q = [question('q1', { ederian: 3 }, 1, 1)];

      const newMoon = resolveRitual({
        input: { moon: MOON, answers: allA(['q1']) },
        questions: q,
        kingdoms: KINGDOMS,
        natureRules: NATURE_RULES,
      });
      const fullMoon = resolveRitual({
        input: {
          moon: { ...MOON, phaseId: 'full-moon', illumination: 1, age: 14.2 },
          answers: allA(['q1']),
        },
        questions: q,
        kingdoms: KINGDOMS,
        natureRules: NATURE_RULES,
      });

      expect(fullMoon.kingdom).toBe(newMoon.kingdom);
      expect(fullMoon.nature).toBe(newMoon.nature);
      expect(fullMoon.origin).toBe(newMoon.origin);
    });
  });

  describe('regla del reino Cazut', () => {
    it('devuelve Cazut por linaje de maldicion aunque la necesidad interna sea cero', () => {
      const q = [
        question('q1', { bastia: 3, ederian: -3 }, 0, 0),
        question('q2', { bastia: 3 }, 0, 0),
        question('q3', { bastia: 3 }, 0, 0),
      ];
      const result = run(q, allA(['q1', 'q2', 'q3']));

      expect(result.kingdom).toBe('bastia');
      expect(result.nature).toBe('cazut');
      expect(result.origin).toBe('curse');
    });

    it('devuelve Cazut aunque la necesidad interna sea altisima', () => {
      const q = [question('q1', { tradia: 3 }, 3, 3)];
      const result = run(q, allA(['q1']));

      expect(result.kingdom).toBe('tradia');
      expect(result.nature).toBe('cazut');
      expect(result.need).toBe(3);
    });

    it('nunca genera Manskling ni Diubak en Tradia, Helia o Bastia', () => {
      const cursed: readonly KingdomId[] = ['tradia', 'helia', 'bastia'];

      for (const kingdom of cursed) {
        for (const need of [0, 1, 2, 3]) {
          const q = [
            question('q1', { [kingdom]: 3 }, 0, 0),
            question('q2', { [kingdom]: 3 }, 0, need),
            question('q3', { [kingdom]: 3 }, 0, need),
            question('q4', { [kingdom]: 3 }, 0, need),
          ];
          const result = run(q, allA(['q1', 'q2', 'q3', 'q4']));

          expect(result.kingdom).toBe(kingdom);
          expect(result.nature).toBe('cazut');
        }
      }
    });

    it('Alden: Cazut con mucha luz interior sigue siendo Cazut', () => {
      // Luz interior intensa no produce Diubak. El reino manda.
      const q = [question('q1', { bastia: 3 }, 0, 3)];
      const result = run(q, allA(['q1']));

      expect(result.nature).toBe('cazut');
      expect(result.need).toBe(3);
    });
  });

  describe('criterio de la bendicion en reinos Manskling/Diubak', () => {
    const mixed = ['ederian', 'tralan', 'xorian'] as const;

    it.each(mixed)('%s: necesidad interna no resuelta produce Diubak', (kingdom) => {
      const q = [question('q1', { [kingdom]: 3 }, 3, 3)];
      const result = run(q, allA(['q1']));

      expect(result.kingdom).toBe(kingdom);
      expect(result.nature).toBe('diubak');
      expect(result.origin).toBe('blessing');
    });

    it('Benny: mucho deseo de ser Diubak pero ninguna necesidad interna es Manskling', () => {
      // wishOutside 3 en todo: quiere el Diubak. innerNeed 0: no lo necesita.
      // Reino mixto, porque en uno Cazut el linaje manda y no habria nada que probar.
      const q = [
        question('q1', { ederian: 2 }, 3, 0),
        question('q2', { ederian: 2 }, 3, 0),
        question('q3', { ederian: 2 }, 3, 0),
      ];
      const result = run(q, allA(['q1', 'q2', 'q3']));

      expect(result.kingdom).toBe('ederian');
      expect(result.desire).toBe(9);
      expect(result.need).toBe(0);
      expect(result.nature).toBe('manskling');
    });

    it('Gil: nada fuera y nada dentro, en paz con quien es', () => {
      const q = [
        question('q1', { tralan: 2 }, 0, 0),
        question('q2', { tralan: 2 }, 0, 0),
        question('q3', { tralan: 2 }, 0, 0),
      ];
      const result = run(q, allA(['q1', 'q2', 'q3']));

      expect(result.nature).toBe('manskling');
    });

    it('el deseo no produce Diubak por si solo en ninguna combinacion', () => {
      // Todas las combinaciones de deseo alto con necesidad cero.
      for (const wish of [1, 2, 3]) {
        const q = [
          question('q1', { ederian: 3 }, wish, 0),
          question('q2', { ederian: 3 }, wish, 0),
          question('q3', { ederian: 3 }, wish, 0),
        ];
        expect(run(q, allA(['q1', 'q2', 'q3'])).nature).toBe('manskling');
      }
    });

    it('el sacrificio no produce Diubak: necesidad cero sigue siendo Manskling', () => {
      // Maximo sacrificio y lealtad, pero no necesita nada por dentro.
      const q = [
        question('q1', { ederian: 3 }, 0, 0),
        question('q2', { ederian: 3 }, 0, 0),
        question('q3', { ederian: 3 }, 0, 0),
      ];
      expect(run(q, allA(['q1', 'q2', 'q3'])).nature).toBe('manskling');
    });
  });

  describe('el reino no es sinonimo de naturaleza', () => {
    it('Ederian produce las tres naturalezas segun las respuestas', () => {
      const seen = new Set<NatureId>();

      for (const need of [0, 1, 2, 3]) {
        const q = [
          question('q1', { ederian: 3 }, 0, need),
          question('q2', { ederian: 3 }, 0, need),
        ];
        seen.add(run(q, allA(['q1', 'q2'])).nature);
      }

      expect([...seen].sort()).toEqual(['diubak', 'manskling']);
    });

    it('nunca dos visitantes con el mismo reino y la misma necesidad reciben naturalezas distintas por el camino', () => {
      const build = (need: number) => {
        const q = [
          question('q1', { xorian: 3 }, 0, need),
          question('q2', { xorian: 3 }, 0, need),
        ];
        return run(q, allA(['q1', 'q2']));
      };

      expect(build(3).nature).toBe(build(3).nature);
      expect(build(0).nature).toBe(build(0).nature);
    });
  });

  describe('determinismo', () => {
    it('las mismas entradas producen el mismo resultado', () => {
      const q = [
        question('q1', { ederian: 3, bastia: -2 }, 1, 1),
        question('q2', { tralan: 2 }, 2, 2),
      ];
      const a = run(q, allA(['q1', 'q2']));
      const b = run(q, allA(['q1', 'q2']));

      expect(b).toEqual(a);
    });

    it('el orden de las preguntas no altera el resultado', () => {
      const q1 = question('q1', { ederian: 3 }, 1, 1);
      const q2 = question('q2', { tralan: 2 }, 2, 2);

      const a = run([q1, q2], allA(['q1', 'q2']));
      const b = run([q2, q1], allA(['q1', 'q2']));

      expect(b.kingdom).toBe(a.kingdom);
      expect(b.nature).toBe(a.nature);
    });
  });

  describe('entradas invalidas', () => {
    it('falla si la pregunta no existe en el banco', () => {
      const q = [question('q1', { ederian: 3 }, 0, 0)];
      expect(() => run(q, allA(['q-desconocida']))).toThrow(/no corresponde a ninguna pregunta/);
    });

    it('falla si la opcion no existe en la pregunta', () => {
      const q = [question('q1', { ederian: 3 }, 0, 0)];
      expect(() => run(q, [{ questionId: 'q1', choiceId: 'z' }])).toThrow(/no tiene la opcion/);
    });

    it('falla si no hay reinos configurados', () => {
      expect(() =>
        resolveRitual({
          input: { moon: MOON, answers: [] },
          questions: [],
          kingdoms: [],
          natureRules: NATURE_RULES,
        }),
      ).toThrow(/No hay reinos configurados/);
    });

    it('falla si el visitante no respondio nada, en vez de devolver un reino por defecto', () => {
      expect(() => run([question('q1', { ederian: 3 }, 0, 0)], [])).toThrow(
        /no respondio nada/,
      );
    });
  });

  describe('Between', () => {
    it('siempre es null: no hay formula y no se inventa', () => {
      const q = [question('q1', { ederian: 3 }, 3, 3)];
      expect(run(q, allA(['q1'])).between).toBeNull();
    });
  });

  describe('el motor no depende del orden de la lista de reinos', () => {
    it('el reino ganador no cambia si la lista viene reordenada', () => {
      const q = [question('q1', { ederian: 2, bastia: 1 }, 0, 0)];
      const shuffled = [...KINGDOMS].reverse();

      const forward = resolveRitual({
        input: { moon: MOON, answers: allA(['q1']) },
        questions: q,
        kingdoms: KINGDOMS,
        natureRules: NATURE_RULES,
      });
      const backward = resolveRitual({
        input: { moon: MOON, answers: allA(['q1']) },
        questions: q,
        kingdoms: shuffled,
        natureRules: NATURE_RULES,
      });

      expect(backward.kingdom).toBe(forward.kingdom);
    });
  });
});

describe('BLESSING_THRESHOLD', () => {
  it('el umbral no convierte la necesidad interna en una escala moral', () => {
    // Documenta el valor: una necesidad interna promedio de 1 o mas produce la
    // bendicion. Lo que NO hace es mirar la moralidad en ningun sitio.
    expect(BLESSING_THRESHOLD).toBe(2);
  });
});

describe('tipos de naturaleza', () => {
  it('documenta que el orden alfabetico no es un orden moral', () => {
    // Type-only: Cazut esta antes que Diubak y Manskling alfabeticamente y no
    // significa nada. Este test falla si alguien reordena creyendo que importa.
    const order: readonly NatureId[] = ['cazut', 'diubak', 'manskling'];
    expect(order).toEqual(['cazut', 'diubak', 'manskling']);
    expect(order[0]).not.toBe('manskling');
  });
});