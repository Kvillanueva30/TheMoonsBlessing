import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { assetUrl } from './asset-url';
import { LANGUAGE, type Language } from '../core/config/experience.config';
import type { MoonPhaseId } from '../core/services/moon.service';

/**
 * Acceso a data/moon/moon-phases.json.
 *
 * Los nombres de las fases son lore y viven en el archivo de datos, no en los
 * componentes. El componente pedía el nombre con un switch hardcodeado, lo que
 * impedía mostrar el idioma configurado y obligaba a editar código para
 * renombrar una fase.
 */
export interface MoonPhaseRecord {
  id: MoonPhaseId;
  name: Record<Language, string>;
  /** Texto narrativo de la revelación. Null hasta que la autora lo escriba. */
  narrative: string | null;
  /** Qué implica esta fase en la ceremonia. Null hasta que se defina. */
  ceremonyNote: string | null;
}

export interface MoonPhasesFile {
  phases: MoonPhaseRecord[];
}

@Injectable({ providedIn: 'root' })
export class MoonPhasesService {
  private readonly http = inject(HttpClient);

  private readonly file = toSignal(
    this.http.get<MoonPhasesFile>(assetUrl('data/moon/moon-phases.json')),
    { initialValue: null },
  );

  /** Todas las fases del universo, en orden, tal como las define el lore. */
  readonly phases = computed<readonly MoonPhaseRecord[]>(() => this.file()?.phases ?? []);

  /** Registro de una fase, o null si el archivo no la define. */
  phaseFor(id: MoonPhaseId): MoonPhaseRecord | null {
    return this.phases().find((phase) => phase.id === id) ?? null;
  }

  /** Nombre de la fase en el idioma configurado. Null si no está en los datos. */
  labelFor(id: MoonPhaseId): string | null {
    return this.phaseFor(id)?.name[LANGUAGE] ?? null;
  }

  /** Texto narrativo de la revelación, cuando la autora lo haya escrito. */
  narrativeFor(id: MoonPhaseId): string | null {
    return this.phaseFor(id)?.narrative ?? null;
  }
}
