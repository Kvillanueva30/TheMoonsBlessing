import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionBankService, BankSelection } from '../../data/question-bank.service';
import { BankQuestion } from '../../core/engine/evidence.adapter';
import { EtchingComponent, EtchingTheme } from '../../shared/etching/etching';
import { SkyComponent } from '../../shared/sky/sky';

/**
 * Pagina de preguntas.
 *
 * Muestra UNA pregunta a la vez, sin contador y sin barra de progreso: el
 * visitante avanza por una historia, no por un formulario.
 *
 * Que lee y que no:
 *   - Lee el TEXTO de las preguntas y las opciones. Nada mas.
 *   - NO lee afinidades, ni canBless, ni evidencia para mostrarla.
 *   - Al terminar NO calcula nada: pasa las respuestas y navega. El
 *     interprete corre en la pagina de resultado, no aqui.
 */
@Component({
  selector: 'app-questions',
  imports: [SkyComponent, EtchingComponent],
  templateUrl: './questions.html',
  styleUrl: './questions.scss',
})
export class QuestionsPage {
  private readonly bank = inject(QuestionBankService);
  private readonly router = inject(Router);

  /** La fecha de nacimiento viaja en la URL: la pagina no la guarda. */
  private readonly date = inject(ActivatedRoute).snapshot.queryParamMap;

  /** Preguntas en el orden del banco, barajadas al cargar. */
  readonly questions = signal<readonly BankQuestion[]>([]);

  /**
   * El reparto que declara el dato, no la pagina.
   *
   * questions.json -> selection dice cuantas preguntas se sirven por visita y
   * de que grupo sale cada una. Sin esto la pagina se llevaba el banco entero
   * (10) cuando el diseño dice 8: 4 de reino, 3 de bendicion y 1 de caracter.
   *
   * El barajado se queda DENTRO de cada grupo: asi el motor recibe la
   * proporcion que espera y el visitante no ve dos veces la misma escena.
   */
  readonly selection = signal<BankSelection | null>(null);

  /** El banco completo. Se guarda aparte para poder volver a servirlo. */
  private readonly bank_ = signal<readonly BankQuestion[]>([]);
  readonly index = signal(0);
  readonly chosen = signal<string | null>(null);

  /** Respuestas acumuladas. Solo ids: el texto vive en el banco. */
  readonly answers = signal<Readonly<Record<string, string>>>({});

  readonly current = computed<BankQuestion | null>(() => this.questions()[this.index()] ?? null);

  /**
   * El sendero: un punto por pregunta, sin numeros.
   *
   * La regla del proyecto es que el visitante nunca ve contadores
   * (questions.json, designRules[0], y AGENTS.md). Asi que esto NO dice
   * "3 de 8": solo dice que se avanza. Un punto por pregunta es
   * inevitablemente dice cuantas hay, pero no dice cual es la actual: no se
   * lee "llevas tres", se lee "hay recorrido".
   */
  readonly dots = computed(() =>
    this.questions().map((_, i) => ({ done: i < this.index(), now: i === this.index() })),
  );

  readonly isLast = computed(
    () => this.questions().length > 0 && this.index() === this.questions().length - 1,
  );

  constructor() {
    this.bank.questions.subscribe((qs) => {
      this.bank_.set(qs);
      this.bank.selection.subscribe((sel) => {
        this.selection.set(sel);
        this.questions.set(serve(qs, sel));
      });
    });
  }

  /** El banco entero, no lo servido. */
  private all(): readonly BankQuestion[] {
    return this.bank_();
  }

  /** Las opciones visibles: solo texto. Nada de etiquetas. */
  readonly options = computed(() =>
    (this.current()?.choices ?? []).map((c) => ({ id: c.id, text: c.text })),
  );

  /**
   * Grabado del tema actual.
   *
   * Es atmosferico: no depende de lo que se responde. El nombre del tema
   * vive en el banco, en el campo `etching`.
   */
  readonly etching = computed<EtchingTheme>(() => {
    const theme = (this.current() as { etching?: EtchingTheme } | null)?.etching;
    return theme ?? 'sujeto';
  });

  choose(choiceId: string): void {
    const question = this.current();
    if (!question) return;
    this.chosen.set(choiceId);
    this.answers.update((a) => ({ ...a, [question.id]: choiceId }));
  }

  next(): void {
    if (!this.chosen()) return;
    if (this.isLast()) {
      this.finish();
      return;
    }
    this.index.update((i) => i + 1);
    this.chosen.set(null);
  }

  back(): void {
    if (this.index() === 0) return;
    const prev = this.index() - 1;
    this.index.set(prev);
    this.chosen.set(this.answers()[this.questions()[prev].id] ?? null);
  }

  /**
   * Al terminar, navega al resultado pasando la fecha y las respuestas.
   *
   * Las respuestas van como `a=pregunta:opcion` para que la pagina de
   * resultado sea reproducible con solo la URL: recargar da el mismo
   * resultado. Es tambien lo que permitiria compartirlo mas adelante.
   */
  private finish(): void {
    const answers = this.answers();
    const y = this.date.get('y');
    const m = this.date.get('m');
    const d = this.date.get('d');

    this.router.navigate(['/result'], {
      queryParams: {
        ...(y && m && d ? { y, m, d } : {}),
        a: Object.keys(answers)
          .sort()
          .map((questionId) => `${questionId}:${answers[questionId]}`),
      },
    });
  }

  reset(): void {
    this.index.set(0);
    this.chosen.set(null);
    this.answers.set({});
    this.questions.set(serve(this.all(), this.selection()));
  }
}

/**
 * Mezcla las preguntas en cada carga.
 *
 * Motivo: el orden fijo despierta una tendencia. Alguien que responde siempre
 * la primera opcion marca el ritmo por posicion, no por lo que corresponde.
 *
 * Es una permutacion: no pierde ni duplica preguntas. Y al recargar cambia,
 * asi que la sesion no se puede "ensayar".
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Sirve las preguntas de la visita: el reparto del dato, en su orden.
 *
 * Si el banco no declara `selection`, devuelve el banco entero barajado: es
 * el comportamiento anterior y no se pierde nada.
 *
 * Dentro de cada grupo si se baraja, y el reparto tampoco se altera al
 * recargar. Cambia QUE preguntas salen de cada grupo, no cuantas: por eso el
 * numero total es estable y se puede pintar un punto por pregunta.
 */
export function serve(
  bank: readonly BankQuestion[],
  selection: BankSelection | null,
): BankQuestion[] {
  if (!selection || !selection.slots) return shuffle(bank);

  const byId = new Map(bank.map((q) => [q.id, q]));
  const out: BankQuestion[] = [];

  for (const slot of Object.values(selection.slots)) {
    // Las obligatorias salen siempre. Sin ellas el motor puede quedarse sin
    // forma de leer la necesidad interna, y la visita no tendria ninguna
    // salida. Ver selection.slots.blessing.required en el dato.
    const obligatorias = (slot.required ?? [])
      .map((id) => byId.get(id))
      .filter((q): q is BankQuestion => !!q);
    for (const q of obligatorias) {
      if (!out.includes(q)) out.push(q);
    }

    // El resto del hueco se llena al azar entre las que no son obligatorias.
    const huecos = Math.max(0, slot.count - obligatorias.length);
    const disponibles = slot.pool
      .filter((id) => !(slot.required ?? []).includes(id))
      .map((id) => byId.get(id))
      .filter((q): q is BankQuestion => !!q);
    // Menos preguntas disponibles que las pedidas: se sirve lo que haya, sin
    // inventar. El numero de puntos se lee de lo servido, no de slot.count.
    for (const q of shuffle(disponibles).slice(0, huecos)) {
      if (!out.includes(q)) out.push(q);
    }
  }

  // Si el dato no cubre alguna pregunta, no se pierde: se anade al final.
  for (const q of bank) {
    if (!out.includes(q) && !reachedBySelection(selection, q.id)) out.push(q);
  }

  return out;
}

function reachedBySelection(selection: BankSelection, id: string): boolean {
  return Object.values(selection.slots).some((s) => s.pool.includes(id));
}