import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing/landing';
import { BirthDatePage } from './pages/birth-date/birth-date';

// Rutas de la experiencia, en el orden del flujo:
//   landing -> birth-date -> moon-reveal -> questions
//            -> kingdom-reveal -> ceremony -> result
// Cada página va en src/app/pages/<nombre>/ como componente standalone.
// Se registran a medida que existan, para no apuntar a componentes inexistentes.
export const routes: Routes = [
  { path: '', component: LandingPage, pathMatch: 'full' },
  { path: 'birth-date', component: BirthDatePage },
  { path: '**', redirectTo: '' },
];
