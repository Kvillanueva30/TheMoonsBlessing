import { Component } from '@angular/core';

// TODO: pantalla de preguntas narrativas. Placeholder para que la ruta
// exista mientras se construye la experiencia por pasos.
@Component({
  selector: 'app-questions',
  template: `<main class="page">
    <div class="stars" aria-hidden="true"></div>
    <p>questions (pendiente)</p>
  </main>`,
  styles: [`
    :host { display: block; min-height: 100vh; }
    .page { position: relative; min-height: 100vh; display: grid; place-items: center; background: radial-gradient(ellipse at 50% -10%, #0b0d14 0%, #05060a 70%); color: #e8e6f0; text-align: center; padding: 2rem; }
    .stars { position: absolute; inset: 0; background: radial-gradient(circle at 15% 25%, rgba(255,255,255,0.8) 1px, transparent 2px), radial-gradient(circle at 35% 55%, rgba(255,255,255,0.6) 1px, transparent 2px), radial-gradient(circle at 55% 15%, rgba(255,255,255,0.7) 1px, transparent 2px), radial-gradient(circle at 75% 35%, rgba(255,255,255,0.5) 1px, transparent 2px), radial-gradient(circle at 95% 65%, rgba(255,255,255,0.8) 1px, transparent 2px), radial-gradient(circle at 25% 85%, rgba(255,255,255,0.6) 1px, transparent 2px), radial-gradient(circle at 85% 85%, rgba(255,255,255,0.7) 1px, transparent 2px); animation: twinkle 8s ease-in-out infinite alternate; pointer-events: none; }
    @keyframes twinkle { 0% { opacity: 0.5; } 100% { opacity: 1; } }
    p { position: relative; z-index: 1; color: #f5c76a; font-size: 1.2rem; }
  `],
})
export class QuestionsPage {}
