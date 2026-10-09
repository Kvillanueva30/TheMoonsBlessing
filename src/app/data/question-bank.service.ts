import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { assetUrl } from './asset-url';
import { BankQuestion } from '../core/engine/evidence.adapter';

// Acceso al banco de preguntas. La UI no lee JSON ni calcula nada:
// lee el banco y lo pasa al motor.

export interface QuestionBank {
  readonly questions: readonly BankQuestion[];

  /**
   * Cuantas preguntas se sirven por visita y de que grupo sale cada una.
   *
   * Lo declara el dato, no el codigo: el reparto de reino / bendicion /
   * caracter esta escrito en questions.json, en `selection`. Si se cambia ahi,
   * esta pagina lo sigue sin tocarse.
   */
  readonly selection?: BankSelection;
}

export interface BankSlot {
  readonly count: number;
  readonly pool: readonly string[];
  /**
   * Preguntas que salen SIEMPRE, antes de rellenar el resto al azar.
   * Se usa cuando el motor necesita que certain evidencia este presente: sin
   * ella hay visitas en las que la lectura no tiene por donde sostenerse.
   */
  readonly required?: readonly string[];
  readonly role: string;
}

export interface BankSelection {
  readonly perVisitor: number;
  readonly slots: Readonly<Record<string, BankSlot>>;
}

@Injectable({ providedIn: 'root' })
export class QuestionBankService {
  private readonly http = inject(HttpClient);
  private readonly bank$ = this.http
    .get<QuestionBank>(assetUrl('data/questions/questions.json'))
    .pipe(shareReplay(1));

  get questions(): Observable<readonly BankQuestion[]> {
    return this.bank$.pipe(map((b) => b.questions));
  }

  /** Solo las que alimentan el perfil interior. */
  get profileQuestions(): Observable<readonly BankQuestion[]> {
    return this.questions.pipe(map((qs) => qs.filter((q) => q.feedsProfile === true)));
  }

  /** Solo las que pueden producir una revelacion de bendicion. */
  get blessingQuestions(): Observable<readonly BankQuestion[]> {
    return this.questions.pipe(map((qs) => qs.filter((q) => q.canBless === true)));
  }

  /** El reparto declarado en el dato. Null si el banco no lo trae. */
  get selection(): Observable<BankSelection | null> {
    return this.bank$.pipe(map((b) => b.selection ?? null));
  }
}