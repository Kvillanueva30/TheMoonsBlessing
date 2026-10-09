import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing/landing';
import { KingdomsPage } from './pages/kingdoms/kingdoms';
import { BirthDatePage } from './pages/birth-date/birth-date';
import { QuestionsPage } from './pages/questions/questions';
import { ResultPage } from './pages/result/result';

// Rutas de la experiencia, en el orden del flujo:
//   landing -> kingdoms -> birth-date -> questions -> result
//
// `kingdoms` es una pantalla de contexto: enseña los seis reinos antes de la
// fecha. NO es una eleccion y no toca el motor.
export const routes: Routes = [
  { path: '', component: LandingPage, pathMatch: 'full' },
  { path: 'kingdoms', component: KingdomsPage },
  { path: 'birth-date', component: BirthDatePage },
  { path: 'questions', component: QuestionsPage },
  { path: 'result', component: ResultPage },
  { path: '**', redirectTo: '' },
];
