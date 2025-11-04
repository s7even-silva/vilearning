import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LabWorkspace } from './lab-workspace/lab-workspace';
import { Quiz } from './quiz/quiz';
import { Results } from './results/results';

type LabState = 'welcome' | 'lab' | 'quiz' | 'results';

@Component({
  selector: 'app-myolab',
  standalone: true,
  imports: [CommonModule, LabWorkspace, Quiz, Results],
  templateUrl: './myolab.html',
  styleUrls: ['./myolab.scss']
})
export class Myolab {
  currentState: LabState = 'welcome';
  finalScore: number = 0;
  totalQuestions: number = 3;

  constructor(private router: Router) {}

  startLab(): void {
    this.currentState = 'lab';
  }

  onLabFinish(): void {
    this.currentState = 'quiz';
  }

  onQuizComplete(score: number): void {
    this.finalScore = score;
    this.currentState = 'results';
  }

  goToCourses(): void {
    this.router.navigate(['/courses']);
  }
}
