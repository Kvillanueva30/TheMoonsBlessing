import { Component, computed, inject, signal } from '@angular/core';
import { QuestionBankService } from '../../data/question-bank.service';
import { BankQuestion, toEvidence } from '../../core/engine/evidence.adapter';
import { interpretGoddess } from '../../core/engine/goddess.engine';
import { GoddessResult, NatureId, OriginId } from '../../core/models/inner.model';
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
 *   - El motor se invoca AL TERMINAR, y su salida se pinta como revelacion.
 *     El componente no decide nada: traduce ids a evidencia y devuelve el
 *     resultado tal cual.
 */
@Component({
  selector: 'app-questions',
  imports: [SkyComponent],
  templateUrl: './questions.html',
  styleUrl: './questions.scss',
})
export class QuestionsPage {
  private readonly bank = inject(QuestionBankService);

  /** Preguntas del perfil, en el orden del banco. */
  readonly questions = signal<readonly BankQuestion[]>([]);
  readonly index = signal(0);
  readonly chosen = signal<string | null>(null);

  /** Respuestas acumuladas. Solo ids: el texto vive en el banco. */
  readonly answers = signal<Readonly<Record<string, string>>>({});

  /** Resultado del motor. Null mientras no se ha terminado. */
  readonly result = signal<GoddessResult | null>(null);

  readonly current = computed<BankQuestion | null>(() => this.questions()[this.index()] ?? null);

  readonly isLast = computed(
    () => this.questions().length > 0 && this.index() === this.questions().length - 1,
  );

  readonly answeredCount = computed(() => Object.keys(this.answers()).length);

  constructor() {
    this.bank.profileQuestions.subscribe((qs) => this.questions.set(shuffle(qs)));
  }

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

  /** Invoca el motor. El componente no interpreta: solo entrega entradas. */
  private finish(): void {
    const questions = this.questions();
    const answers = this.answers();

    const { evidence } = toEvidence(questions);
    const chosen = questions
      .map((q) => {
        const choiceId = answers[q.id];
        return evidence.find((e) => e.questionId === q.id && e.choiceId === choiceId);
      })
      .filter((e): e is NonNullable<typeof e> => e !== undefined);

    // El canon todavia no se aplica aqui: el reino se resuelve en su propia
    // capa. Se pasa vacio para que la naturaleza salga del perfil.
    this.result.set(interpretGoddess({ evidence: chosen, canonicalNature: [] }));
  }

  readonly nature = computed<NatureId | null>(() => this.result()?.nature ?? null);
  readonly origin = computed<OriginId | null>(() => this.result()?.origin ?? null);
  readonly revelation = computed(() => this.result()?.revelation ?? null);

  /** Etiqueta legible. El texto de naturaleza vive en results.json, no aqui. */
  readonly natureLabel = computed<string>(() => {
    const n = this.nature();
    if (n === 'diubak') return 'Diubak';
    if (n === 'cazut') return 'Cazut';
    if (n === 'manskling') return 'Manskling';
    return '';
  });

  /** Las opciones visibles: solo texto. Nada de etiquetas. */
  options(): readonly { id: string; text: string }[] {
    return (this.current()?.choices ?? []).map((c) => ({ id: c.id, text: c.text }));
  }

  /** Evidencias que la Diosa puede nombrar, tal cual las produjo el visitante. */
  perceivedLines(): readonly string[] {
    return (this.revelation()?.perceived ?? []).map((e) => e.text);
  }

  reset(): void {
    this.index.set(0);
    this.chosen.set(null);
    this.answers.set({});
    this.result.set(null);
    this.questions.set(shuffle(this.questions()));
  }
}

/**
 * Mezcla las preguntas en cada carga.
 *
 * Motivo: el orden fijo despierta una tendencia. Alguien que responde siempre
 * la primera opción marca el ritmo por posición, no por lo que corresponde.
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