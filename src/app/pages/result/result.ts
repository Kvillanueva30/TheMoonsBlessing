import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RitualSessionService } from '../../core/services/ritual-session.service';
import { KingdomService, KingdomData } from '../../data/kingdom.service';
import { QuestionBankService } from '../../data/question-bank.service';
import { MoonPhasesService } from '../../data/moon-phases.service';
import { MoonComponent } from '../../shared/moon/moon';
import { SkyComponent } from '../../shared/sky/sky';
import { MoonPhaseResult } from '../../core/services/moon.service';
import { GoddessResult, NatureId } from '../../core/models/inner.model';
import { KingdomId } from '../../core/models/ritual.model';

/**
 * Pagina de resultado.
 *
 * Muestra LAS TRES COSAS, y las mantiene separadas:
 *
 *   tu luna     <- la fase de nacimiento, calculada de la fecha real
 *   tu reino    <- deducido por afinidad con un legado. Nunca elegido.
 *   tu naturaleza<- interpretacion del perfil interno
 *
 * El visitante no ha elegido nada de esto. Solo ha contestado.
 */
@Component({
  selector: 'app-result',
  imports: [SkyComponent, MoonComponent],
  templateUrl: './result.html',
  styleUrl: './result.scss',
})
export class ResultPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(RitualSessionService);
  private readonly kingdomService = inject(KingdomService);
  private readonly bank = inject(QuestionBankService);
  private readonly moonPhases = inject(MoonPhasesService);

  readonly moon = signal<MoonPhaseResult | null>(null);
  readonly moonLabel = signal<string | null>(null);
  readonly kingdom = signal<KingdomData | null>(null);
  readonly nature = signal<GoddessResult | null>(null);
  readonly ready = signal(false);
  readonly missing = signal(false);

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const answers = readAnswers(params.getAll('a'));
    if (Object.keys(answers).length === 0) {
      this.missing.set(true);
      return;
    }
    this.session.setAnswers(answers);

    // --- Luna. Se calcula sola y no se cruza con nada mas.
    const y = Number(params.get('y'));
    const m = Number(params.get('m'));
    const d = Number(params.get('d'));
    if (y && m && d) {
      const phase = this.session.getMoon({ year: y, month: m, day: d });
      this.moon.set(phase);
      this.moonLabel.set(this.moonPhases.labelFor(phase.id));
    }

    this.bank.questions.subscribe((questions) => {
      this.kingdomService.kingdoms.subscribe((kingdoms) => {
        const ids = kingdoms.map((k) => k.id);

        // --- Reino. Solo afinidad con legados.
        const kingdomId = this.session.getKingdom(questions, ids);
        const kingdomData = kingdoms.find((k) => k.id === kingdomId) ?? null;
        this.kingdom.set(kingdomData);

        // --- Naturaleza. El canon del reino se le pasa y SIEMPRE gana.
        const canonical: readonly NatureId[] = kingdomData?.natures ?? [];
        this.nature.set(this.session.getNature(questions, canonical));
        this.ready.set(true);
      });
    });
  }

  // --- Textos. Todos salen de los datos o del motor, ninguno hardcodeado. ---

  readonly natureLabel = computed(() => {
    const n = this.nature()?.nature;
    if (n === 'manskling') return 'Manskling';
    if (n === 'diubak') return 'Diubak';
    if (n === 'cazut') return 'Cazut';
    return '';
  });

  readonly reason = computed(() => this.nature()?.revelation.reason ?? '');
  readonly founderName = computed(() => this.kingdom()?.founder?.name ?? null);
  readonly kingdomEssence = computed(() => this.kingdom()?.essence?.es ?? null);
  readonly phaseId = computed(() => this.moon()?.id ?? null);

  /** Frases que el visitante eligio y que sostienen la revelacion. */
  readonly perceived = computed(() => this.nature()?.revelation.perceived ?? []);

  restart(): void {
    this.session.reset();
    this.router.navigate(['/']);
  }
}

/** Lee respuestas del tipo a=b-002:c&a=b-003:b */
function readAnswers(params: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of params) {
    const [questionId, choiceId] = raw.split(':');
    if (questionId && choiceId) out[questionId] = choiceId;
  }
  return out;
}