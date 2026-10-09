import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { RitualSessionService } from '../../core/services/ritual-session.service';
import { KingdomService, KingdomData } from '../../data/kingdom.service';
import { QuestionBankService } from '../../data/question-bank.service';
import { MoonPhasesService } from '../../data/moon-phases.service';
import { ResultsService } from '../../data/results.service';
import { MoonComponent } from '../../shared/moon/moon';
import { SkyComponent } from '../../shared/sky/sky';
import { ShareCardComponent } from '../../shared/share-card/share-card';
import { ShareCardData } from '../../shared/share-card/share-card.model';
import { ShareService } from '../../core/services/share.service';
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
  imports: [SkyComponent, MoonComponent, ShareCardComponent],
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
  private readonly results = inject(ResultsService);

  readonly moon = signal<MoonPhaseResult | null>(null);
  private readonly shareService = inject(ShareService);

  /**
   * Textos de naturaleza de results.json. Se leen con toSignal porque el
   * archivo se carga por HTTP y no existe todavia en el constructor.
   */
  private readonly resultsData = toSignal(this.results.results, { initialValue: null });

  /**
   * El nombre sale del archivo de fases, que se carga por HTTP y todavia no
   * esta disponible en el constructor. Por eso se calcula desde la senal y no
   * se fija una vez: si se fijara ahi, quedaria en null para siempre y la luna
   * no se dibujaria nunca.
   */
  readonly moonLabel = computed(() => {
    const phase = this.moon();
    return phase ? this.moonPhases.labelFor(phase.id) : null;
  });
  readonly kingdom = signal<KingdomData | null>(null);
  readonly nature = signal<GoddessResult | null>(null);
  readonly ready = signal(false);
  readonly missing = signal(false);

  /** Estado del boton de compartir: durante el proceso se deshabilita. */
  readonly sharing = signal(false);

  /**
 * Nodo de la tarjeta oculta, para capturarlo.
 *
 * Query opcional y no requerida: la tarjeta vive dentro de un @if, y si el
 * visitante llega al boton sin que el bloque se haya pintado, required lanzaria
 * una excepcion en vez de dar un mensaje. generateImage() tiene ademas un
 * respaldo por documento.
 */
  readonly shareCard = viewChild<ElementRef<HTMLElement>>('shareCardEl');

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
      this.moon.set(this.session.getMoon({ year: y, month: m, day: d }));
    }

    this.bank.questions.subscribe((questions) => {
      this.kingdomService.kingdoms.subscribe((kingdoms) => {
        const ids = kingdoms.map((k) => k.id);

        // --- Reino. Solo afinidad con legados.
        const kingdomId = this.session.getKingdom(questions, ids);
        const kingdomData = kingdoms.find((k) => k.id === kingdomId) ?? null;
        this.kingdom.set(kingdomData);

        // --- Naturaleza. El canon del reino se le pasa y SIEMPRE gana sobre la
        // naturaleza vigente. El clasificador corre igual y queda en
        // originalNature; transformed solo lo declara el dato del reino.
        const canonical: readonly NatureId[] = kingdomData?.natures ?? [];
        const huboTransformacion = kingdomData?.transformedByCurse === true;
        this.nature.set(this.session.getNature(questions, canonical, huboTransformacion));
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

  /**
   * Transformacion historica, si la hubo.
   *
   * Solo se muestra cuando el dato del reino declara la transformacion Y la
   * naturaleza vigente es cazut. El texto explica el hecho: la diosa
   * transformo a todos los ciudadanos del reino despues de la guerra, sin
   * importar lo que fueran antes.
   *
   * No dice nada bueno ni malo de ninguna de las dos naturalezas. La
   * original es una INFERENCIA de las respuestas, y se rotula como tal.
   */
  readonly wasTransformed = computed(() => {
    const n = this.nature();
    return !!n && n.transformed && n.originalNature.value !== n.nature;
  });

  readonly originalNatureLabel = computed(() => {
    const n = this.nature();
    if (!this.wasTransformed()) return null;
    const v = n?.originalNature.value;
    if (v === 'manskling') return 'Manskling';
    if (v === 'diubak') return 'Diubak';
    return null;
  });

  readonly transformationNote = computed(
    () => this.kingdom()?.transformationNote ?? null,
  );

  /** Frases que el visitante eligio y que sostienen la revelacion. */
  readonly perceived = computed(() => this.nature()?.revelation.perceived ?? []);

  // ---------------------------------------------------------------------
  // Compartir
  // ---------------------------------------------------------------------

  /**
   * Datos de la tarjeta. Todos salen de lo que ya esta en pantalla: nada se
   * calcula aqui, nada del lore se escribe en este archivo.
   */
  readonly shareData = computed<ShareCardData | null>(() => {
    const label = this.natureLabel();
    if (!label) return null;

    return {
      natureLabel: label,
      natureMeaning: this.resultsData()?.natures?.[this.nature()?.nature ?? '']?.meaning ?? '',
      kingdomName: this.kingdom()?.name ?? null,
      founderName: this.founderName(),
      moonLabel: this.moonLabel(),
    };
  });

  /**
   * Boton principal. Intenta compartir con la Web Share API; si el navegador no
   * la soporta, descarga el PNG.
   *
   * No dice nada al visitante ni cuando funciona ni cuando no. Es lo que se
   * decidio: si la imagen salio, el selector del sistema o la descarga ya se
   * ven; un texto debajo solo anade ruido.
   */
  async share(): Promise<void> {
    const blob = await this.generateImage();
    if (!blob) return;

    if (await this.shareService.canShareFile(blob)) {
      try {
        await this.shareService.shareFile(
          blob,
          `Soy ${this.natureLabel()}`,
          `Mi lugar en Madar: ${this.natureLabel()}.`,
        );
      } catch {
        // El usuario cancelo el selector. No es un fallo ni hay que avisar.
      }
      return;
    }

    this.shareService.download(blob);
  }

  /** Captura la tarjeta oculta. Si no puede, devuelve null y no dice nada. */
  private async generateImage(): Promise<Blob | null> {
    if (this.sharing()) return null;
    this.sharing.set(true);

    try {
      const host = this.shareCard()?.nativeElement ?? null;
      // Se captura el div interior .card, no el host <app-share-card>: el host
      // esta fuera de pantalla y la libreria de captura no lo clona bien.
      const card =
        host?.querySelector<HTMLElement>('.card') ??
        document.querySelector<HTMLElement>('app-share-card .card');

      if (!card) return null;

      return await this.shareService.capture(card);
    } finally {
      this.sharing.set(false);
    }
  }

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