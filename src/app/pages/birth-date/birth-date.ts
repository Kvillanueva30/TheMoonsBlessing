import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SkyComponent } from '../../shared/sky/sky';

@Component({
  selector: 'app-birth-date',
  imports: [FormsModule, SkyComponent],
  templateUrl: './birth-date.html',
  styleUrl: './birth-date.scss',
})
export class BirthDatePage {
  private readonly router = inject(Router);

  day = 1;
  month = 1;
  year = 2000;

  days = Array.from({ length: 31 }, (_, i) => i + 1);
  months = Array.from({ length: 12 }, (_, i) => i + 1);
  years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - 119 + i);

  submit() {
    const date = new Date(this.year, this.month - 1, this.day);
    this.router.navigate(['/moon-reveal'], {
      queryParams: {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
      },
    });
  }
}
