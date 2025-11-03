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
  cameraActive = false;
  isLoading = true;
  errorMessage = '';
  
  // Estados de la mano
  fingerStates: FingerState = {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false
  };
  
  isFistClosed = false;

  // Variables de MediaPipe
  private stream: MediaStream | null = null;
  private hands: any;
  private camera: any;
  private scriptsLoaded = false;

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

  async ngOnInit(): Promise<void> {
    console.log('Iniciando laboratorio...');
    await this.loadMediaPipeScripts();
    await this.initializeLab();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async loadMediaPipeScripts(): Promise<void> {
    if (window.Hands && window.Camera) {
      this.scriptsLoaded = true;
      console.log('Scripts ya cargados');
      return;
    }

    console.log('Cargando scripts de MediaPipe...');

    return new Promise((resolve, reject) => {
      const drawingUtils = document.createElement('script');
      drawingUtils.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
      drawingUtils.crossOrigin = 'anonymous';
      
      drawingUtils.onload = () => {
        const cameraUtils = document.createElement('script');
        cameraUtils.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
        cameraUtils.crossOrigin = 'anonymous';
        
        cameraUtils.onload = () => {
          const handsScript = document.createElement('script');
          handsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
          handsScript.crossOrigin = 'anonymous';
          
          handsScript.onload = () => {
            this.scriptsLoaded = true;
            console.log('Scripts cargados correctamente');
            resolve();
          };
          
          handsScript.onerror = () => reject(new Error('Error cargando Hands'));
          document.head.appendChild(handsScript);
        };
        
        cameraUtils.onerror = () => reject(new Error('Error cargando Camera Utils'));
        document.head.appendChild(cameraUtils);
      };
      
      drawingUtils.onerror = () => reject(new Error('Error cargando Drawing Utils'));
      document.head.appendChild(drawingUtils);
    });
  }

  async initializeLab(): Promise<void> {
    try {
      // Esperar un poco para que los ViewChild estén listos
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!this.scriptsLoaded) {
        throw new Error('Scripts de MediaPipe no cargados');
      }

      console.log('Solicitando acceso a la cámara...');
      await this.startCamera();
      
      this.isLoading = false;
      
    } catch (error: any) {
      console.error('Error al inicializar laboratorio:', error);
      this.errorMessage = this.getErrorMessage(error);
      this.isLoading = false;
    }
  }

  async startCamera(): Promise<void> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara');
      }

      console.log('Solicitando permisos de cámara...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false
      });
      
      console.log('Stream obtenido');

      // Obtener elemento de video directamente del DOM
      const video = document.querySelector('video') as HTMLVideoElement;
      
      if (!video) {
        throw new Error('Elemento de video no encontrado en el DOM');
      }

      console.log('Elemento de video encontrado:', video);
      
      video.srcObject = this.stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      
      console.log('Esperando metadata del video...');
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout esperando video'));
        }, 10000);

        video.onloadedmetadata = () => {
          console.log('Metadata cargada:', video.videoWidth, 'x', video.videoHeight);
          clearTimeout(timeout);
          
          video.play()
            .then(() => {
              console.log('Video reproduciendo');
              this.cameraActive = true;
              resolve();
            })
            .catch(reject);
        };

        video.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });

      console.log('Inicializando MediaPipe...');
      setTimeout(() => this.initializeMediaPipe(), 1000);
      
    } catch (error: any) {
      console.error('Error al acceder a la cámara:', error);
      throw error;
    }
  }

  initializeMediaPipe(): void {
    if (!window.Hands || !window.Camera) {
      console.error('MediaPipe no disponible');
      return;
    }

    try {
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

      this.hands.onResults((results: any) => this.onResults(results));

      // Obtener video del DOM
      const video = document.querySelector('video') as HTMLVideoElement;
      
      if (!video) {
        console.error('No se encontró el elemento de video');
        return;
      }
      
      this.camera = new window.Camera(video, {
        onFrame: async () => {
          if (this.hands && video.readyState === 4) {
            await this.hands.send({ image: video });
          }
        },
        width: 1280,
        height: 720
      });

      this.camera.start();
      console.log('MediaPipe inicializado');
      
    } catch (error) {
      console.error('Error al inicializar MediaPipe:', error);
    }
  }

  onResults(results: any): void {
    // Obtener elementos del DOM directamente
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    const video = document.querySelector('video') as HTMLVideoElement;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      this.drawHand(ctx, landmarks, canvas.width, canvas.height);
      this.detectFingerStates(landmarks);
    } else {
      this.fingerStates = { thumb: false, index: false, middle: false, ring: false, pinky: false };
      this.isFistClosed = false;
    }

    ctx.restore();
  }

  drawHand(ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number): void {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    });

    landmarks.forEach((landmark: any) => {
      ctx.beginPath();
      ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FF0000';
      ctx.fill();
    });
  }

  detectFingerStates(landmarks: any[]): void {
    this.fingerStates.thumb = landmarks[4].y > landmarks[3].y;
    this.fingerStates.index = landmarks[8].y > landmarks[6].y;
    this.fingerStates.middle = landmarks[12].y > landmarks[10].y;
    this.fingerStates.ring = landmarks[16].y > landmarks[14].y;
    this.fingerStates.pinky = landmarks[20].y > landmarks[18].y;
    this.isFistClosed = Object.values(this.fingerStates).every(state => state);
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.camera) {
      this.camera.stop();
    }
    this.cameraActive = false;
  }

  finishLab(): void {
    this.stopCamera();
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

  retryCamera(): void {
    this.errorMessage = '';
    this.isLoading = true;
    this.initializeLab();
  }

  getErrorMessage(error: any): string {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Permiso denegado. Por favor, permite el acceso a la cámara en tu navegador.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No se encontró ninguna cámara en tu dispositivo.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'La cámara está siendo usada por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara.';
    } else {
      return 'Error al iniciar la cámara: ' + error.message;
    }
  }
}