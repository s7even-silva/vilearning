import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { WebcamImage, WebcamModule } from 'ngx-webcam';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

@Component({
  selector: 'app-myolab',
  standalone: true,
  imports: [CommonModule, WebcamModule],
  templateUrl: './myolab.html',
  styleUrls: ['./myolab.scss']
})
export class Myolab implements OnInit, OnDestroy {
  // Camera properties - usando el patrón que funciona
  permissionStatus: string = '';
  camData: any = null;
  capturedImage: any = '';
  trigger: Subject<void> = new Subject();

  // Lab state
  labStarted: boolean = false;
  scriptsLoaded: boolean = false;
  detectionActive: boolean = false;
  
  // MediaPipe
  hands: any = null;
  camera: any = null;
  
  // Hand detection
  handDetected: boolean = false;
  fingerStates: FingerState = {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false
  };
  currentGesture: string = 'Ninguno';
  
  // Quiz
  showQuiz: boolean = false;
  currentQuestionIndex: number = 0;
  score: number = 0;
  quizCompleted: boolean = false;
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

  ngOnInit(): void {
    this.loadMediaPipeScripts();
  }

  ngOnDestroy(): void {
    this.stopDetection();
    if (this.camData) {
      this.camData.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
    }
  }

  get $trigger(): Observable<void> {
    return this.trigger.asObservable();
  }

  loadMediaPipeScripts(): void {
    // Cargar MediaPipe Hands
    const handsScript = document.createElement('script');
    handsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
    handsScript.crossOrigin = 'anonymous';
    
    handsScript.onload = () => {
      // Cargar MediaPipe Camera Utils
      const cameraScript = document.createElement('script');
      cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      cameraScript.crossOrigin = 'anonymous';
      
      cameraScript.onload = () => {
        console.log('✅ Scripts de MediaPipe cargados correctamente');
        this.scriptsLoaded = true;
      };
      
      cameraScript.onerror = () => {
        console.error('❌ Error al cargar camera_utils');
      };
      
      document.head.appendChild(cameraScript);
    };
    
    handsScript.onerror = () => {
      console.error('❌ Error al cargar MediaPipe Hands');
    };
    
    document.head.appendChild(handsScript);
  }

  // Método que funciona - copiado de tu código
  checkPermission(): void {
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then((response) => {
        this.permissionStatus = 'Allowed';
        this.camData = response;
        this.labStarted = true;
        console.log('✅ Permisos de cámara concedidos:', this.camData);
        
        // Esperar a que la webcam se inicialice antes de empezar detección
        setTimeout(() => {
          if (this.scriptsLoaded) {
            this.initializeMediaPipe();
          } else {
            console.log('⏳ Esperando que los scripts se carguen...');
            const checkScripts = setInterval(() => {
              if (this.scriptsLoaded) {
                clearInterval(checkScripts);
                this.initializeMediaPipe();
              }
            }, 500);
          }
        }, 1500);
      })
      .catch(err => {
        this.permissionStatus = 'Not Allowed';
        console.error('❌ Error al acceder a la cámara:', err);
        alert('Por favor, permite el acceso a la cámara para usar el laboratorio.');
      });
  }

  capture(event: WebcamImage): void {
    // Este método se mantiene para compatibilidad con ngx-webcam
    console.log('📸 Imagen capturada:', event);
    this.capturedImage = event.imageAsDataUrl;
  }

  captureImage(): void {
    this.trigger.next();
  }

  initializeMediaPipe(): void {
    if (!window.Hands) {
      console.error('❌ MediaPipe Hands no está disponible');
      return;
    }

    console.log('🚀 Inicializando MediaPipe Hands...');

    this.hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults((results: any) => {
      this.processHandResults(results);
    });

    this.startDetection();
  }

  startDetection(): void {
    const videoElement = document.querySelector('video');
    
    if (!videoElement) {
      console.error('❌ Elemento de video no encontrado');
      return;
    }

    if (!window.Camera) {
      console.error('❌ Camera utils no está disponible');
      return;
    }

    console.log('🎥 Iniciando detección con MediaPipe Camera...');

    this.camera = new window.Camera(videoElement, {
      onFrame: async () => {
        if (this.hands && this.detectionActive) {
          await this.hands.send({ image: videoElement });
        }
      },
      width: 640,
      height: 480
    });

    this.camera.start();
    this.detectionActive = true;
    console.log('✅ Detección iniciada');
  }

  stopDetection(): void {
    this.detectionActive = false;
    if (this.camera) {
      this.camera.stop();
    }
  }

  processHandResults(results: any): void {
    const canvas = document.getElementById('output-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      this.handDetected = true;
      const landmarks = results.multiHandLandmarks[0];
      
      // Dibujar conexiones de la mano
      this.drawConnectors(ctx, landmarks);
      
      // Dibujar puntos de referencia
      this.drawLandmarks(ctx, landmarks);
      
      // Detectar estado de dedos
      this.detectFingerStates(landmarks);
      
      // Detectar gesto
      this.detectGesture();
      
      // Enviar datos por WebSocket (placeholder)
      this.sendDataToRobot();
    } else {
      this.handDetected = false;
      this.currentGesture = 'Ninguno';
    }
  }

  drawConnectors(ctx: CanvasRenderingContext2D, landmarks: any[]): void {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Pulgar
      [0, 5], [5, 6], [6, 7], [7, 8], // Índice
      [0, 9], [9, 10], [10, 11], [11, 12], // Medio
      [0, 13], [13, 14], [14, 15], [15, 16], // Anular
      [0, 17], [17, 18], [18, 19], [19, 20], // Meñique
      [5, 9], [9, 13], [13, 17] // Palma
    ];

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x * 640, startPoint.y * 480);
      ctx.lineTo(endPoint.x * 640, endPoint.y * 480);
      ctx.stroke();
    });
  }

  drawLandmarks(ctx: CanvasRenderingContext2D, landmarks: any[]): void {
    landmarks.forEach((landmark, index) => {
      ctx.beginPath();
      ctx.arc(landmark.x * 640, landmark.y * 480, 5, 0, 2 * Math.PI);
      ctx.fillStyle = index === 0 ? '#FF0000' : '#00FF00';
      ctx.fill();
    });
  }

  detectFingerStates(landmarks: any[]): void {
    // Pulgar
    this.fingerStates.thumb = landmarks[4].x < landmarks[3].x;
    
    // Otros dedos (extendidos si la punta está por encima de la articulación)
    this.fingerStates.index = landmarks[8].y < landmarks[6].y;
    this.fingerStates.middle = landmarks[12].y < landmarks[10].y;
    this.fingerStates.ring = landmarks[16].y < landmarks[14].y;
    this.fingerStates.pinky = landmarks[20].y < landmarks[18].y;
  }

  detectGesture(): void {
    const { thumb, index, middle, ring, pinky } = this.fingerStates;
    
    if (!thumb && !index && !middle && !ring && !pinky) {
      this.currentGesture = '✊ Puño cerrado';
    } else if (thumb && index && middle && ring && pinky) {
      this.currentGesture = '🖐️ Mano abierta';
    } else if (!thumb && index && middle && !ring && !pinky) {
      this.currentGesture = '✌️ Victoria';
    } else if (!thumb && index && !middle && !ring && !pinky) {
      this.currentGesture = '☝️ Índice';
    } else if (thumb && !index && !middle && !ring && pinky) {
      this.currentGesture = '🤙 Shaka';
    } else {
      this.currentGesture = '🤚 Gesto personalizado';
    }
  }

  sendDataToRobot(): void {
    // Placeholder para envío por WebSocket
    const data = {
      timestamp: Date.now(),
      fingers: this.fingerStates,
      gesture: this.currentGesture
    };
    
    // Aquí iría la lógica de WebSocket
    // this.websocketService.send(data);
    console.log('📡 Datos para enviar:', data);
  }

  finishLab(): void {
    this.stopDetection();
    this.showQuiz = true;
  }

  selectAnswer(index: number): void {
    if (!this.answerSubmitted) {
      this.selectedAnswer = index;
    }
  }

  submitAnswer(): void {
    if (this.selectedAnswer === null) return;
    
    this.answerSubmitted = true;
    
    if (this.selectedAnswer === this.questions[this.currentQuestionIndex].correct) {
      this.score++;
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedAnswer = null;
      this.answerSubmitted = false;
    } else {
      this.quizCompleted = true;
    }
  }

  restartLab(): void {
    window.location.reload();
  }

  get currentQuestion(): QuizQuestion {
    return this.questions[this.currentQuestionIndex];
  }

  get isCorrectAnswer(): boolean {
    return this.selectedAnswer === this.currentQuestion.correct;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}