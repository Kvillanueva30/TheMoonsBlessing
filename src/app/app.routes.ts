import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing/landing';
import { NaturesPage } from './pages/natures/natures';
import { BirthDatePage } from './pages/birth-date/birth-date';
import { QuestionsPage } from './pages/questions/questions';
import { ResultPage } from './pages/result/result';

// Rutas de la experiencia, en el orden del flujo:
//   landing -> natures -> birth-date -> questions -> result
//
// La pantalla de las tres naturalezas REEMPLAZO a la de los seis reinos.
// El componente de reinos sigue en src/app/pages/kingdoms/, sin borrar, pero
// ya no esta en ninguna ruta y por tanto no se muestra a nadie.
//
// `natures` es una pantalla de contexto: enseña las tres naturalezas antes de
// la fecha. NO es una eleccion y no toca el motor. La naturaleza la calcula el
// motor despues de las respuestas.
export const routes: Routes = [
  { path: '', component: LandingPage, pathMatch: 'full' },
  { path: 'natures', component: NaturesPage },
  { path: 'birth-date', component: BirthDatePage },
  { path: 'questions', component: QuestionsPage },
  { path: 'result', component: ResultPage },
  { path: '**', redirectTo: '' },
];