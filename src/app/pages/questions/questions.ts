import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionBankService } from '../../data/question-bank.service';
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
  readonly index = signal(0);
  readonly chosen = signal<string | null>(null);

  /** Respuestas acumuladas. Solo ids: el texto vive en el banco. */
  readonly answers = signal<Readonly<Record<string, string>>>({});

  readonly current = computed<BankQuestion | null>(() => this.questions()[this.index()] ?? null);

  readonly isLast = computed(
    () => this.questions().length > 0 && this.index() === this.questions().length - 1,
  );

  constructor() {
    this.bank.questions.subscribe((qs) => this.questions.set(shuffle(qs)));
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
    this.questions.set(shuffle(this.questions()));
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