import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { assetUrl } from './asset-url';
import { BankQuestion } from '../core/engine/evidence.adapter';

// Acceso al banco de preguntas. La UI no lee JSON ni calcula nada:
// lee el banco y lo pasa al motor.

export interface QuestionBank {
  readonly questions: readonly BankQuestion[];
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
}