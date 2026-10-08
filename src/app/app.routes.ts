import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing/landing';
import { BirthDatePage } from './pages/birth-date/birth-date';
import { QuestionsPage } from './pages/questions/questions';
import { ResultPage } from './pages/result/result';

// Rutas de la experiencia, en el orden del flujo:
//   landing -> birth-date -> questions -> result
export const routes: Routes = [
  { path: '', component: LandingPage, pathMatch: 'full' },
  { path: 'birth-date', component: BirthDatePage },
  { path: 'questions', component: QuestionsPage },
  { path: 'result', component: ResultPage },
  { path: '**', redirectTo: '' },
];
