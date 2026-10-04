import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EXPERIENCE_NAME } from './core/config/experience.config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal(EXPERIENCE_NAME);

  constructor() {
    // El <title> del index.html no puede leer el config de TypeScript, así
    // que se fija al arrancar. Así el nombre de la experiencia vive en un
    // único sitio y el título del navegador no se queda desactualizado.
    document.title = EXPERIENCE_NAME;
  }
}
