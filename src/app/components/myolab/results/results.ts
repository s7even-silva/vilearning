import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.html',
  styleUrls: ['./results.scss']
})
export class Results {
  @Input() score: number = 0;
  @Input() totalQuestions: number = 3;

  constructor(private router: Router) {}

  get percentage(): number {
    return (this.score / this.totalQuestions) * 100;
  }

  get feedbackMessage(): string {
    const percentage = this.percentage;
    if (percentage === 100) {
      return '🎉 ¡Excelente! Dominas completamente el tema de las prótesis mioeléctricas.';
    } else if (percentage >= 67) {
      return '👍 ¡Muy bien! Tienes un buen entendimiento del tema. Revisa los conceptos donde tuviste errores.';
    } else {
      return '📚 Buen intento. Te recomendamos revisar el material del laboratorio para reforzar tus conocimientos.';
    }
  }

  restartLab(): void {
    window.location.reload();
  }

  goToCourses(): void {
    this.router.navigate(['/courses']);
  }
}
