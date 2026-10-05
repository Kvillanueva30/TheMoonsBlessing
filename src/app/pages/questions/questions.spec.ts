import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { QuestionsPage, shuffle } from './questions';

/**
 * Tests de la pagina de preguntas.
 *
 * Fija el CONTRATO:
 *   - La pagina muestra texto, nunca afinidades ni evidencia.
 *   - El orden es aleatorio y es una permutacion.
 *   - Al terminar NO calcula nada: navega con las respuestas.
 */

const BANK = {
  questions: [
    { id: 'b-001', theme: 'Suficiencia', text: 'Uno', feedsProfile: true, canBless: false,
      choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
    { id: 'b-002', theme: 'Lo que falta', text: 'Dos', feedsProfile: true, canBless: true,
      choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
    { id: 'l-001', theme: 'Por que te levantas', text: 'Reino', feedsProfile: false, canBless: false,
      choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
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
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(QuestionsPage);
    page = fixture.componentInstance;
  });

  afterEach(() => {
    const pending = http.match(() => true);
    for (const req of pending) req.flush({ questions: [] });
    http.verify();
  });

  function loadBank() {
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('data/questions/questions.json')).flush(BANK);
    fixture.detectChanges();
  }

  describe('carga', () => {
    it('pregunta TODAS las del banco, no solo el perfil', () => {
      loadBank();
      // La capa de reino necesita l-001; si la pagina la filtrara, el reino
      // quedaria sin datos. Se preguntan todas.
      expect(page.questions().length).toBe(3);
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
      for (let i = 0; i < 60; i++) ordenes.add(shuffle(BASE).join(','));
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
      expect(page.isLast()).toBe(false);
    });
  });

  describe('la UI no calcula nada', () => {
    it('no expone naturaleza, afinidades ni interpretacion', () => {
      loadBank();
      const own = page as unknown as Record<string, unknown>;
      for (const key of ['result', 'nature', 'natureLabel', 'revelation', 'affinities', 'evidence', 'interpretation', 'origin', 'perceivedLines']) {
        expect(own[key]).toBeUndefined();
      }
    });

    it('las opciones visibles solo llevan id y texto', () => {
      loadBank();
      for (const option of page.options()) {
        expect(Object.keys(option).sort()).toEqual(['id', 'text']);
      }
    });
  });

  describe('reiniciar', () => {
    it('limpia respuestas e indice', () => {
      loadBank();
      page.choose('a');
      page.next();
      page.reset();
      expect(page.index()).toBe(0);
      expect(page.answers()).toEqual({});
      expect(page.chosen()).toBeNull();
    });

    it('vuelve a barajar', () => {
      loadBank();
      page.reset();
      expect(page.questions().length).toBe(3);
    });
  });
});