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
}
