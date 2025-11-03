import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { WebcamImage, WebcamModule } from 'ngx-webcam';

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
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

@Component({
  selector: 'app-myolab',
  standalone: true,
  imports: [CommonModule, FormsModule, WebcamModule],
  templateUrl: './myolab.html',
  styleUrls: ['./myolab.scss']
})
export class Myolab implements OnInit, OnDestroy {
  @ViewChild('handCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Control de cámara
  permissionStatus: string = '';
  cameraActive = false;
  isLoading = true;
  showCamera = false;
  trigger: Subject<void> = new Subject();

  // MediaPipe Hands
  private hands: any;
  private canvasCtx: CanvasRenderingContext2D | null = null;

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

  get $trigger(): Observable<void> {
    return this.trigger.asObservable();
  }

  ngOnInit(): void {
    console.log('Iniciando laboratorio...');
    this.loadMediaPipeScripts();
  }

  ngOnDestroy(): void {
    if (this.hands) {
      this.hands.close();
    }
  }

  loadMediaPipeScripts(): void {
    // Cargar scripts de MediaPipe
    const handsScript = document.createElement('script');
    handsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js';
    handsScript.crossOrigin = 'anonymous';
    document.head.appendChild(handsScript);

    const drawingScript = document.createElement('script');
    drawingScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.js';
    drawingScript.crossOrigin = 'anonymous';
    document.head.appendChild(drawingScript);

    // Esperar a que los scripts se carguen
    handsScript.onload = () => {
      console.log('MediaPipe Hands cargado');
      setTimeout(() => {
        this.isLoading = false;
      }, 500);
    };

    handsScript.onerror = () => {
      console.error('Error cargando MediaPipe Hands');
      this.isLoading = false;
    };
  }

  checkPermission(): void {
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        this.permissionStatus = 'Allowed';
        this.cameraActive = true;
        this.showCamera = true;
        console.log('Permiso de cámara concedido');

        // Detener el stream inmediatamente, ngx-webcam lo manejará
        stream.getTracks().forEach(track => track.stop());

        // Inicializar MediaPipe después de un breve delay
        setTimeout(() => this.initializeMediaPipe(), 1000);
      })
      .catch(err => {
        this.permissionStatus = 'Not Allowed';
        this.cameraActive = false;
        console.error('Permiso de cámara denegado:', err);
      });
  }

  initializeMediaPipe(): void {
    if (!window.Hands) {
      console.error('MediaPipe Hands no está disponible');
      setTimeout(() => this.initializeMediaPipe(), 500);
      return;
    }

    this.hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults((results: any) => this.onHandResults(results));

    console.log('MediaPipe Hands inicializado');
  }

  handleImage(webcamImage: WebcamImage): void {
    if (!this.hands || !webcamImage) {
      return;
    }

    // Crear una imagen para procesar
    const img = new Image();
    img.onload = async () => {
      try {
        await this.hands.send({ image: img });
      } catch (error) {
        console.error('Error procesando imagen:', error);
      }
    };
    img.src = webcamImage.imageAsDataUrl;
  }

  onHandResults(results: any): void {
    if (!this.canvasRef) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    if (!this.canvasCtx) {
      this.canvasCtx = canvas.getContext('2d');
    }

    if (!this.canvasCtx) {
      return;
    }

    // Limpiar canvas
    this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Dibujar la mano
      this.drawHand(landmarks, canvas);

      // Analizar dedos
      this.analyzeFingers(landmarks);
    } else {
      this.handStateText = 'No se detecta mano';
      this.fingerStates = { thumb: false, index: false, middle: false, ring: false, pinky: false };
      this.isFistClosed = false;
    }
  }

  drawHand(landmarks: any[], canvas: HTMLCanvasElement): void {
    if (!this.canvasCtx) return;

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],      // Pulgar
      [0, 5], [5, 6], [6, 7], [7, 8],      // Índice
      [0, 9], [9, 10], [10, 11], [11, 12], // Medio
      [0, 13], [13, 14], [14, 15], [15, 16], // Anular
      [0, 17], [17, 18], [18, 19], [19, 20], // Meñique
      [5, 9], [9, 13], [13, 17]            // Palma
    ];

    // Dibujar conexiones
    this.canvasCtx.strokeStyle = '#00FF00';
    this.canvasCtx.lineWidth = 3;

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      this.canvasCtx!.beginPath();
      this.canvasCtx!.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
      this.canvasCtx!.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
      this.canvasCtx!.stroke();
    });

    // Dibujar puntos
    const fingerTips = [4, 8, 12, 16, 20];
    landmarks.forEach((landmark: any, index: number) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;

      this.canvasCtx!.beginPath();
      this.canvasCtx!.arc(x, y, fingerTips.includes(index) ? 8 : 5, 0, 2 * Math.PI);
      this.canvasCtx!.fillStyle = fingerTips.includes(index) ? '#FF0000' : '#00FF00';
      this.canvasCtx!.fill();
      this.canvasCtx!.strokeStyle = 'white';
      this.canvasCtx!.lineWidth = 2;
      this.canvasCtx!.stroke();
    });
  }

  analyzeFingers(landmarks: any[]): void {
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerPips = [3, 6, 10, 14, 18];

    const isFingerExtended = (fingerIndex: number): boolean => {
      const tipIndex = fingerTips[fingerIndex];
      const pipIndex = fingerPips[fingerIndex];

      if (fingerIndex === 0) { // Pulgar
        return landmarks[tipIndex].x < landmarks[pipIndex].x;
      } else {
        return landmarks[tipIndex].y < landmarks[pipIndex].y;
      }
    };

    // Analizar cada dedo
    this.fingerStates.thumb = isFingerExtended(0);
    this.fingerStates.index = isFingerExtended(1);
    this.fingerStates.middle = isFingerExtended(2);
    this.fingerStates.ring = isFingerExtended(3);
    this.fingerStates.pinky = isFingerExtended(4);

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
  }

  startCapture(): void {
    // Capturar imágenes continuamente
    setInterval(() => {
      if (this.cameraActive && this.showCamera) {
        this.trigger.next();
      }
    }, 100); // Capturar cada 100ms (10 fps)
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
