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
  /** Mensaje breve para el visitante tras compartir o descargar. */
  readonly shareNote = signal<string | null>(null);

  /** Nodo de la tarjeta oculta, para capturarlo. */
  readonly shareCard = viewChild.required<ElementRef<HTMLElement>>('shareCardEl');

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

  // ---------------------------------------------------------------------
  // Compartir
  // ---------------------------------------------------------------------

  /**
   * Datos de la tarjeta. Todos salen de lo que ya esta en pantalla: nada se
   * calcula aqui, nada del lore se escribe en este archivo.
   *
   * `reason` es el texto de la revelacion. La URL se arma con el origen real
   * del sitio para que el enlace impreso en la imagen sea el de verdad.
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
      reason: this.reason(),
      url: window.location.origin + window.location.pathname,
    };
  });

  /**
   * Boton principal. Intenta compartir con la Web Share API; si el navegador no
   * la soporta, descarga el PNG.
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
        this.shareNote.set('Resultado compartido.');
      } catch {
        // El usuario cancelo el selector. No es un fallo ni hay que avisar.
      }
      return;
    }

    this.shareService.download(blob);
    this.shareNote.set('Imagen descargada.');
  }

  /** Camino explicito de descarga, siempre disponible. */
  downloadImage(): void {
    void (async () => {
      const blob = await this.generateImage();
      if (blob) {
        this.shareService.download(blob);
        this.shareNote.set('Imagen descargada.');
      }
    })();
  }

  /** Captura la tarjeta oculta. Avisa si el navegador no puede. */
  private async generateImage(): Promise<Blob | null> {
    if (this.sharing()) return null;
    this.sharing.set(true);
    this.shareNote.set(null);

    try {
      const blob = await this.shareService.capture(this.shareCard().nativeElement);
      if (!blob) {
        this.shareNote.set('Tu navegador no pudo generar la imagen.');
      }
      return blob;
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