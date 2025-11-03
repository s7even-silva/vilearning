import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
export class Myolab implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoElement', {static: false}) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  // Estados del laboratorio
  labStarted = false;
  cameraActive = false;
  isConnecting = false;
  scriptsLoaded = false;
  
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
    this.loadMediaPipeScripts();
  }

  ngAfterViewInit(): void {
    console.log('VideoElement en AfterViewInit: ', this.videoElement);
    // luego llamar a startCamera si lo deseas
    this.startCamera();
    // Los elementos ya están disponibles aquí
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  loadMediaPipeScripts(): void {
    // Verificar si ya están cargados
    if (window.Hands && window.Camera) {
      this.scriptsLoaded = true;
      return;
    }

    // Cargar Drawing Utils primero
    const drawingUtils = document.createElement('script');
    drawingUtils.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
    drawingUtils.crossOrigin = 'anonymous';
    
    drawingUtils.onload = () => {
      // Luego Camera Utils
      const cameraUtils = document.createElement('script');
      cameraUtils.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      cameraUtils.crossOrigin = 'anonymous';
      
      cameraUtils.onload = () => {
        // Finalmente Hands
        const handsScript = document.createElement('script');
        handsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        handsScript.crossOrigin = 'anonymous';
        
        handsScript.onload = () => {
          this.scriptsLoaded = true;
          console.log('Scripts de MediaPipe cargados correctamente');
        };
        
        handsScript.onerror = () => {
          console.error('Error al cargar MediaPipe Hands');
        };
        
        document.head.appendChild(handsScript);
      };
      
      cameraUtils.onerror = () => {
        console.error('Error al cargar Camera Utils');
      };
      
      document.head.appendChild(cameraUtils);
    };
    
    drawingUtils.onerror = () => {
      console.error('Error al cargar Drawing Utils');
    };
    
    document.head.appendChild(drawingUtils);
  }

  async startLab(): Promise<void> {
    if (!this.scriptsLoaded) {
      alert('Los scripts de detección aún se están cargando. Por favor, espera un momento e intenta de nuevo.');
      return;
    }

    this.labStarted = true;
    this.isConnecting = true;

    try {
      // Simular conexión al servidor
      await this.simulateServerConnection();
      
      // Iniciar cámara
      await this.startCamera();
      
      this.isConnecting = false;
    } catch (error) {
      console.error('Error al iniciar el laboratorio:', error);
      this.isConnecting = false;
      alert('Hubo un error al iniciar el laboratorio. Por favor, recarga la página e intenta de nuevo.');
    }
  }

  async simulateServerConnection(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Conectado al servidor (simulado)');
        resolve();
      }, 1500);
    });
  }

  async startCamera(): Promise<void> {
    try {
      console.log('Solicitando acceso a la cámara...');
      
      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara');
      }

      // Primero intentar con configuración más simple
      let constraints: MediaStreamConstraints = {
        video: true,
        audio: false
      };

      console.log('Intentando acceder a la cámara con constraints:', constraints);
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Stream obtenido:', this.stream);
      console.log('Tracks de video:', this.stream.getVideoTracks());
      
      if (!this.videoElement) {
        throw new Error('Elemento de video no disponible');
      }
      
      const video = this.videoElement.nativeElement;
      video.srcObject = this.stream;
      video.muted = true; // Asegurar que esté muteado
      video.playsInline = true; // Importante para móviles
      
      console.log('Video element configurado, esperando metadata...');
      
      // Esperar a que el video esté listo
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout esperando metadata del video'));
        }, 10000);

        video.onloadedmetadata = () => {
          console.log('Metadata cargada, dimensiones:', video.videoWidth, 'x', video.videoHeight);
          clearTimeout(timeout);
          
          video.play()
            .then(() => {
              console.log('Video reproduciendo');
              this.cameraActive = true;
              resolve();
            })
            .catch((playError) => {
              console.error('Error al reproducir video:', playError);
              reject(playError);
            });
        };

        video.onerror = (error) => {
          console.error('Error en el elemento video:', error);
          clearTimeout(timeout);
          reject(error);
        };
      });

      console.log('Video iniciado correctamente, inicializando MediaPipe...');

      // Inicializar MediaPipe después de que el video esté listo
      setTimeout(() => {
        this.initializeMediaPipe();
      }, 500);
      
    } catch (error: any) {
      console.error('Error completo al acceder a la cámara:', error);
      console.error('Nombre del error:', error.name);
      console.error('Mensaje del error:', error.message);
      
      let errorMessage = 'No se pudo acceder a la cámara. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Permiso denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'La cámara está siendo usada por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage += 'La cámara no cumple con los requisitos necesarios.';
      } else {
        errorMessage += 'Error: ' + error.message;
      }
      
      alert(errorMessage);
      this.isConnecting = false;
      this.labStarted = false;
      this.cameraActive = false;
    }
  }

  initializeMediaPipe(): void {
    if (!window.Hands || !window.Camera) {
      console.error('MediaPipe no está disponible');
      alert('Error al cargar el sistema de detección. Por favor, recarga la página.');
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

      const video = this.videoElement.nativeElement;
      
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
      console.log('MediaPipe inicializado correctamente');
      
    } catch (error) {
      console.error('Error al inicializar MediaPipe:', error);
      alert('Error al iniciar el sistema de detección. Por favor, recarga la página.');
    }
  }

  onResults(results: any): void {
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !this.videoElement) return;

    const video = this.videoElement.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Limpiar canvas
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar la imagen del video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Dibujar la mano
      this.drawHand(ctx, landmarks, canvas.width, canvas.height);
      
      // Detectar estado de los dedos
      this.detectFingerStates(landmarks);
      
      // Enviar datos al servidor (simulado)
      this.sendToServer(this.fingerStates);
    } else {
      // Si no se detecta mano, resetear estados
      this.fingerStates = {
        thumb: false,
        index: false,
        middle: false,
        ring: false,
        pinky: false
      };
      this.isFistClosed = false;
    }

    ctx.restore();
  }

  drawHand(ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number): void {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Pulgar
      [0, 5], [5, 6], [6, 7], [7, 8], // Índice
      [0, 9], [9, 10], [10, 11], [11, 12], // Medio
      [0, 13], [13, 14], [14, 15], [15, 16], // Anular
      [0, 17], [17, 18], [18, 19], [19, 20], // Meñique
      [5, 9], [9, 13], [13, 17] // Palma
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
    // Detectar cada dedo basándose en la posición de los landmarks
    // Pulgar
    this.fingerStates.thumb = landmarks[4].y > landmarks[3].y;
    
    // Índice
    this.fingerStates.index = landmarks[8].y > landmarks[6].y;
    
    // Medio
    this.fingerStates.middle = landmarks[12].y > landmarks[10].y;
    
    // Anular
    this.fingerStates.ring = landmarks[16].y > landmarks[14].y;
    
    // Meñique
    this.fingerStates.pinky = landmarks[20].y > landmarks[18].y;

    // Detectar puño cerrado
    this.isFistClosed = Object.values(this.fingerStates).every(state => state);
  }

  sendToServer(data: FingerState): void {
    // Aquí iría la lógica para enviar al WebSocket
    // console.log('Datos de la mano:', data);
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
    this.labStarted = false;
    this.showQuiz = false;
    this.currentQuestionIndex = 0;
    this.userAnswers = [null, null, null];
    this.quizCompleted = false;
    this.score = 0;
    this.fingerStates = {
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false
    };
    this.isFistClosed = false;
  }

  goToHome(): void {
    window.location.href = '/';
  }

  // Método de diagnóstico
  async testCamera(): Promise<void> {
    try {
      console.log('=== DIAGNÓSTICO DE CÁMARA ===');
      console.log('Navigator.mediaDevices disponible:', !!navigator.mediaDevices);
      console.log('getUserMedia disponible:', !!navigator.mediaDevices?.getUserMedia);
      
      // Listar dispositivos disponibles
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('Dispositivos totales:', devices.length);
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        console.log('Cámaras encontradas:', videoDevices.length);
        videoDevices.forEach((device, index) => {
          console.log(`Cámara ${index + 1}:`, device.label || 'Sin nombre', device.deviceId);
        });
      }
      
      // Intentar acceso básico
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('✓ Acceso a cámara exitoso');
      console.log('Stream ID:', testStream.id);
      console.log('Video tracks:', testStream.getVideoTracks().length);
      
      testStream.getVideoTracks().forEach(track => {
        console.log('Track settings:', track.getSettings());
        track.stop();
      });
      
      alert('✓ Cámara funcionando correctamente!\n\nPuedes ver los detalles en la consola (F12)');
      
    } catch (error: any) {
      console.error('✗ Error en diagnóstico:', error);
      alert('✗ Error al acceder a la cámara:\n\n' + error.name + ': ' + error.message);
    }
  }
}