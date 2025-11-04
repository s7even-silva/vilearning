import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.scss']
})
export class Quiz {
  @Output() onComplete = new EventEmitter<number>();

  currentQuestionIndex: number = 0;
  score: number = 0;
  selectedAnswer: number | null = null;
  answerSubmitted: boolean = false;

  questions: QuizQuestion[] = [
    {
      question: '¿Qué tecnología se utiliza para detectar la posición de la mano en este laboratorio?',
      options: [
        'OpenCV',
        'MediaPipe Hands',
        'TensorFlow Object Detection',
        'YOLO'
      ],
      correct: 1,
      explanation: 'MediaPipe Hands es una solución de Google que proporciona detección de manos y seguimiento de puntos clave en tiempo real.'
    },
    {
      question: '¿Cuántos puntos de referencia (landmarks) detecta MediaPipe Hands en cada mano?',
      options: [
        '15 puntos',
        '21 puntos',
        '25 puntos',
        '30 puntos'
      ],
      correct: 1,
      explanation: 'MediaPipe Hands detecta 21 puntos de referencia en cada mano, cubriendo todos los dedos y la palma.'
    },
    {
      question: '¿Qué aplicación práctica tienen las prótesis mioeléctricas?',
      options: [
        'Solo para deportes',
        'Reemplazo funcional de extremidades perdidas',
        'Únicamente para fisioterapia',
        'Solo para uso estético'
      ],
      correct: 1,
      explanation: 'Las prótesis mioeléctricas permiten a personas con amputaciones recuperar funcionalidad mediante el control de la prótesis con señales musculares.'
    }
  ];

  get currentQuestion(): QuizQuestion {
    return this.questions[this.currentQuestionIndex];
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  selectAnswer(index: number): void {
    if (!this.answerSubmitted) {
      this.selectedAnswer = index;
    }
  }

  submitAnswer(): void {
    if (this.selectedAnswer === null) return;

    this.answerSubmitted = true;

    if (this.selectedAnswer === this.currentQuestion.correct) {
      this.score++;
    }
  }

  nextQuestion(): void {
    if (!this.isLastQuestion) {
      this.currentQuestionIndex++;
      this.selectedAnswer = null;
      this.answerSubmitted = false;
    } else {
      this.onComplete.emit(this.score);
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
