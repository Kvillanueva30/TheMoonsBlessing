import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { ResultsService } from '../../data/results.service';
import { EXPERIENCE_NAME } from '../../core/config/experience.config';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingPage {
  protected readonly results = inject(ResultsService).results;
  protected readonly name = EXPERIENCE_NAME;
}
