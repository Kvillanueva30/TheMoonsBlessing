import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing/landing';
import { BirthDatePage } from './pages/birth-date/birth-date';
import { MoonRevealPage } from './pages/moon-reveal/moon-reveal';
import { QuestionsPage } from './pages/questions/questions';
import { ResultPage } from './pages/result/result';

// Rutas de la experiencia, en el orden del flujo:
//   landing -> birth-date -> moon-reveal -> questions
//            -> kingdom-reveal -> ceremony -> result
// Cada página va en src/app/pages/<nombre>/ como componente standalone.
// Se registran a medida que existan, para no apuntar a componentes inexistentes.
export const routes: Routes = [
  { path: '', component: LandingPage, pathMatch: 'full' },
  { path: 'birth-date', component: BirthDatePage },
  { path: 'moon-reveal', component: MoonRevealPage },
  { path: 'questions', component: QuestionsPage },
  { path: 'result', component: ResultPage },
  { path: '**', redirectTo: '' },
];
