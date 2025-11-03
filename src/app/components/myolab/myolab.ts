import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

@Component({
  selector: 'app-myolab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './myolab.html',
  styleUrls: ['./myolab.scss']
})
export class Myolab implements OnInit, OnDestroy {
  // Estados del laboratorio
  isLoading = true;
  cameraActive = false;
  
  // Estados de la mano
  fingerStates: FingerState = {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false
  };
  
  isFistClosed = false;
  handStateText = 'Esperando mano...';

  // Cuestionario
  showQuiz = false;
  currentQuestionIndex = 0;
  userAnswers: (number | null)[] = [null, null, null];
  quizCompleted = false;
  score = 0;

  questions: Question[] = [
    {
      id: 1,
      question: '¿Qué son las prótesis mioeléctricas?',
      options: [
        'Prótesis mecánicas simples',
        'Prótesis controladas por señales eléctricas de los músculos',
        'Prótesis decorativas sin funcionalidad',
        'Prótesis controladas por voz'
      ],
      correctAnswer: 1,
      explanation: 'Las prótesis mioeléctricas utilizan señales eléctricas generadas por la contracción muscular (EMG) para controlar el movimiento de la prótesis.'
    },
    {
      id: 2,
      question: '¿Qué tecnología se utilizó en este laboratorio para detectar el movimiento de la mano?',
      options: [
        'Sensores táctiles',
        'Visión por computadora e inteligencia artificial',
        'Electromiografía directa',
        'Control manual con botones'
      ],
      correctAnswer: 1,
      explanation: 'En este laboratorio utilizamos visión por computadora con modelos de IA (MediaPipe) para detectar y rastrear los movimientos de la mano en tiempo real.'
    },
    {
      id: 3,
      question: '¿Cuál es la principal ventaja de usar visión por computadora en el control de prótesis?',
      options: [
        'Es más económico que otros métodos',
        'Permite control sin contacto y puede capturar movimientos naturales',
        'Es más preciso que los sensores EMG',
        'No requiere calibración'
      ],
      correctAnswer: 1,
      explanation: 'La visión por computadora permite capturar movimientos naturales sin necesidad de sensores físicos, aunque en prótesis reales se combinan ambas tecnologías para mejor precisión.'
    }
  ];

  ngOnInit(): void {
    console.log('Iniciando laboratorio...');
    this.loadScriptsAndInitialize();
  }

  ngOnDestroy(): void {
    // Limpiar recursos si es necesario
  }

  loadScriptsAndInitialize(): void {
    // Cargar scripts de MediaPipe
    const drawingUtils = document.createElement('script');
    drawingUtils.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils';
    document.head.appendChild(drawingUtils);

    const cameraUtils = document.createElement('script');
    cameraUtils.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils';
    document.head.appendChild(cameraUtils);

    const handsScript = document.createElement('script');
    handsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';
    document.head.appendChild(handsScript);

    // Esperar a que los scripts se carguen y luego inicializar
    handsScript.onload = () => {
      console.log('Scripts cargados');
      setTimeout(() => this.initializeHandDetection(), 1000);
    };
  }

  initializeHandDetection(): void {
    const videoElement = document.getElementById('videoElement') as HTMLVideoElement;
    const canvasElement = document.getElementById('handCanvas') as HTMLCanvasElement;
    
    if (!videoElement) {
      console.error('No se encontró videoElement');
      setTimeout(() => this.initializeHandDetection(), 500);
      return;
    }
    if (!canvasElement) {
      console.error('No se encontró canvas Element');
      setTimeout(() => this.initializeHandDetection(), 500);
      return;
    }
    const canvasCtx = canvasElement.getContext('2d')!;

    const fingerTips = [4, 8, 12, 16, 20];
    const fingerPips = [3, 6, 10, 14, 18];

    const isFingerExtended = (landmarks: any[], fingerIndex: number): boolean => {
      const tipIndex = fingerTips[fingerIndex];
      const pipIndex = fingerPips[fingerIndex];

      if (fingerIndex === 0) { // Pulgar
        return landmarks[tipIndex].x < landmarks[pipIndex].x;
      } else {
        return landmarks[tipIndex].y < landmarks[pipIndex].y;
      }
    };

    const drawHand = (landmarks: any[]) => {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17]
      ];

      canvasCtx.strokeStyle = '#00FF00';
      canvasCtx.lineWidth = 3;

      connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];

        canvasCtx.beginPath();
        canvasCtx.moveTo(startPoint.x * canvasElement.width, startPoint.y * canvasElement.height);
        canvasCtx.lineTo(endPoint.x * canvasElement.width, endPoint.y * canvasElement.height);
        canvasCtx.stroke();
      });

      landmarks.forEach((landmark: any, index: number) => {
        const x = landmark.x * canvasElement.width;
        const y = landmark.y * canvasElement.height;

        canvasCtx.beginPath();
        canvasCtx.arc(x, y, fingerTips.includes(index) ? 8 : 5, 0, 2 * Math.PI);
        canvasCtx.fillStyle = fingerTips.includes(index) ? '#FF0000' : '#00FF00';
        canvasCtx.fill();
        canvasCtx.strokeStyle = 'white';
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
      });
    };

    const onResults = (results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Analizar dedos
        this.fingerStates.thumb = isFingerExtended(landmarks, 0);
        this.fingerStates.index = isFingerExtended(landmarks, 1);
        this.fingerStates.middle = isFingerExtended(landmarks, 2);
        this.fingerStates.ring = isFingerExtended(landmarks, 3);
        this.fingerStates.pinky = isFingerExtended(landmarks, 4);

        // Detectar puño cerrado
        const extendedCount = Object.values(this.fingerStates).filter(x => x).length;
        this.isFistClosed = extendedCount === 0;

        // Actualizar texto del estado
        if (extendedCount === 0) {
          this.handStateText = '✊ PUÑO CERRADO';
        } else if (extendedCount === 5) {
          this.handStateText = '🖐️ MANO ABIERTA';
        } else if (extendedCount === 1 && this.fingerStates.index) {
          this.handStateText = '☝️ ÍNDICE';
        } else if (extendedCount === 2 && this.fingerStates.index && this.fingerStates.middle) {
          this.handStateText = '✌️ VICTORIA';
        } else {
          this.handStateText = `${extendedCount} dedos extendidos`;
        }

        drawHand(landmarks);
      } else {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        this.handStateText = 'No se detecta mano';
        this.fingerStates = { thumb: false, index: false, middle: false, ring: false, pinky: false };
        this.isFistClosed = false;
      }
    };

    const hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    const camera = new window.Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });

    camera.start().then(() => {
      console.log('Cámara iniciada');
      this.isLoading = false;
      this.cameraActive = true;
    }).catch((error: any) => {
      console.error('Error al iniciar cámara:', error);
      this.isLoading = false;
    });
  }

  finishLab(): void {
    this.showQuiz = true;
  }

  selectAnswer(questionIndex: number, answerIndex: number): void {
    this.userAnswers[questionIndex] = answerIndex;
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  submitQuiz(): void {
    this.score = 0;
    this.userAnswers.forEach((answer, index) => {
      if (answer === this.questions[index].correctAnswer) {
        this.score++;
      }
    });
    this.quizCompleted = true;
  }

  restartLab(): void {
    window.location.reload();
  }

  goToHome(): void {
    window.location.href = '/';
  }
}