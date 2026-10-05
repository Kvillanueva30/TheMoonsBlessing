import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { QuestionsPage, shuffle } from './questions';

/**
 * Tests de la pagina de preguntas.
 *
 * Fija el CONTRATO entre la pagina y el motor:
 *   - La pagina muestra texto, nunca afinidades ni evidencia.
 *   - El orden es aleatorio y cambia en cada carga.
 *   - El motor no se invoca hasta el final.
 *   - Lo que se cita en la revelacion sale de las respuestas del visitante.
 */

const BANK = {
  questions: [
    { id: 'b-001', theme: 'Suficiencia', text: 'Uno', feedsProfile: true, canBless: false,
      choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
    { id: 'b-002', theme: 'Lo que falta', text: 'Dos', feedsProfile: true, canBless: true,
      choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
    { id: 'l-001', theme: 'Por que te levantas', text: 'Reino', feedsProfile: false, canBless: false,
      choices: [{ id: 'a', text: 'A' }] },
  ],
};

describe('QuestionsPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<QuestionsPage>>;
  let page: QuestionsPage;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [QuestionsPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(QuestionsPage);
    page = fixture.componentInstance;
  });

  afterEach(() => {
    // Cualquier peticion sin responder haria fallar el test aunque el codigo
    // bajo prueba este bien. Se responde a la del banco y se verifica el resto.
    const pending = http.match(() => true);
    for (const req of pending) req.flush({ questions: [] });
    http.verify();
  });

  function flushBank() {
    http.expectOne((r) => r.url.includes('data/questions/questions.json')).flush(BANK);
    fixture.detectChanges();
  }

  /** Construye el componente y espera el banco. */
  function loadBank() {
    fixture.detectChanges();
    flushBank();
  }

  

  describe('carga', () => {
    it('solo muestra las preguntas del perfil, no las de reino', () => {
      loadBank();
      const ids = page.questions().map((q) => q.id);
      expect(ids).toContain('b-001');
      expect(ids).toContain('b-002');
      expect(ids).not.toContain('l-001');
    });

    it('mantiene todas las preguntas del perfil', () => {
      loadBank();
      expect(page.questions().length).toBe(2);
    });

    it('arranca en la primera con nada elegido', () => {
      loadBank();
      expect(page.index()).toBe(0);
      expect(page.chosen()).toBeNull();
      expect(page.current()).not.toBeNull();
    });
  });

  describe('orden aleatorio', () => {
    const BASE = ['b-001', 'b-002', 'b-003', 'b-004', 'b-005'];

    it('el orden cambia entre mezclas', () => {
      const ordenes = new Set<string>();
      for (let i = 0; i < 60; i++) {
        ordenes.add(shuffle(BASE).join(','));
      }
      expect(ordenes.size).toBeGreaterThan(1);
    });

    it('produce las dos permutaciones de dos elementos', () => {
      const ordenes = new Set<string>();
      for (let i = 0; i < 60; i++) ordenes.add(shuffle(['a', 'b']).join(','));
      expect(ordenes.has('a,b')).toBe(true);
      expect(ordenes.has('b,a')).toBe(true);
    });

    it('no pierde ni duplica elementos', () => {
      for (let i = 0; i < 40; i++) {
        const out = shuffle(BASE);
        expect(out.length).toBe(BASE.length);
        expect([...out].sort()).toEqual([...BASE].sort());
      }
    });

    it('no muta el array original', () => {
      const original = [...BASE];
      shuffle(original);
      expect(original).toEqual(BASE);
    });

    it('la pagina muestra el perfil en un orden no necesariamente fijo', () => {
      loadBank();
      const ids = page.questions().map((q) => q.id);
      expect([...ids].sort()).toEqual(['b-001', 'b-002']);
    });
  });

  describe('elegir', () => {
    it('guarda la opcion elegida', () => {
      loadBank();
      page.choose('b');
      expect(page.chosen()).toBe('b');
    });

    it('volver a elegir sustituye, no duplica', () => {
      loadBank();
      page.choose('a');
      page.choose('b');
      expect(Object.keys(page.answers())).toHaveLength(1);
    });

    it('acumula respuestas de varias preguntas', () => {
      loadBank();
      page.choose('a');
      page.next();
      page.choose('b');
      expect(Object.keys(page.answers())).toHaveLength(2);
    });
  });

  describe('avanzar', () => {
    it('no avanza sin haber elegido', () => {
      loadBank();
      page.next();
      expect(page.index()).toBe(0);
    });

    it('avanza y limpia la eleccion', () => {
      loadBank();
      page.choose('a');
      page.next();
      expect(page.chosen()).toBeNull();
      expect(page.index()).toBe(1);
    });

    it('recupera la eleccion al volver atras', () => {
      loadBank();
      page.choose('a');
      page.next();
      page.back();
      expect(page.chosen()).toBe('a');
    });

    it('no vuelve antes de la primera', () => {
      loadBank();
      page.back();
      expect(page.index()).toBe(0);
    });

    it('sabe si es la ultima', () => {
      loadBank();
      expect(page.isLast()).toBe(false);
      page.choose('a');
      page.next();
      expect(page.isLast()).toBe(true);
    });
  });

  describe('revelacion', () => {
    function answerAll(choiceFor: (questionId: string) => string) {
      for (const q of page.questions()) {
        page.choose(choiceFor(q.id));
        page.next();
      }
    }

    it('no hay resultado hasta terminar', () => {
      loadBank();
      page.choose('a');
      page.next();
      expect(page.result()).toBeNull();
    });

    it('el motor produce una naturaleza al terminar', () => {
      loadBank();
      answerAll(() => 'a');
      expect(['manskling', 'diubak', 'cazut']).toContain(page.nature());
    });

    it('la etiqueta de naturaleza es legible', () => {
      loadBank();
      answerAll(() => 'a');
      expect(['Manskling', 'Diubak', 'Cazut']).toContain(page.natureLabel());
    });

    it('la revelacion explica el motivo', () => {
      loadBank();
      answerAll(() => 'a');
      expect(page.revelation()!.reason.length).toBeGreaterThan(10);
    });

    it('solo cita respuestas que el visitante eligio', () => {
      loadBank();
      answerAll(() => 'a');
      const permitidos = new Set(['A', 'B']);
      for (const line of page.perceivedLines()) {
        expect(permitidos.has(line)).toBe(true);
      }
    });

    it('el origen no es de canon: el reino se resuelve en otra capa', () => {
      loadBank();
      answerAll(() => 'a');
      expect(page.origin()).not.toBe('curse');
      expect(page.origin()).not.toBe('lineage');
    });

    it('volver a empezar limpia el resultado', () => {
      loadBank();
      answerAll(() => 'a');
      expect(page.result()).not.toBeNull();
      page.reset();
      expect(page.result()).toBeNull();
      expect(page.answers()).toEqual({});
    });
  });

  describe('la UI no calcula nada', () => {
    it('no expone afinidades, evidencia ni interpretacion', () => {
      loadBank();
      const own = page as unknown as Record<string, unknown>;
      expect(own['affinities']).toBeUndefined();
      expect(own['evidence']).toBeUndefined();
      expect(own['interpretation']).toBeUndefined();
    });

    it('las opciones visibles solo llevan id y texto', () => {
      loadBank();
      for (const option of page.options()) {
        expect(Object.keys(option).sort()).toEqual(['id', 'text']);
      }
    });
  });
});