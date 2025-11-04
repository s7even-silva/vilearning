import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

export interface HandDetectionState {
  handDetected: boolean;
  fingerStates: FingerState;
  currentGesture: string;
  landmarks: Landmark[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class HandDetectionService {
  private hands!: Hands;
  private camera!: Camera;
  private canvasCtx!: CanvasRenderingContext2D;
  private stream!: MediaStream;

  private detectionState = new BehaviorSubject<HandDetectionState>({
    handDetected: false,
    fingerStates: {
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false
    },
    currentGesture: 'Ninguno',
    landmarks: null
  });

  public state$: Observable<HandDetectionState> = this.detectionState.asObservable();

  constructor(private ngZone: NgZone) {}

  async initialize(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ): Promise<void> {
    try {
      // Solicitar permisos de cámara
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      // Asignar el stream al elemento de video
      videoElement.srcObject = this.stream;

      this.canvasCtx = canvasElement.getContext('2d')!;

      // Configurar MediaPipe Hands
      this.hands = new Hands({
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

      this.hands.onResults((results: Results) => this.onResults(results));

      // Configurar cámara
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          await this.hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
      });

      this.camera.start();
    } catch (error) {
      console.error('Error al inicializar detección de manos:', error);
      throw error;
    }
  }

  private onResults(results: Results): void {
    // Limpiar y dibujar el video en el canvas
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, 640, 480);
    this.canvasCtx.drawImage(results.image, 0, 0, 640, 480);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0] as Landmark[];

      // Dibujar la mano
      this.drawHand(landmarks);

      // Detectar estado de dedos usando fingerpose
      const fingerStates = this.detectFingerStatesWithFingerpose(landmarks);

      // Detectar gesto
      const gesture = this.detectGesture(fingerStates);

      // Actualizar estado dentro de NgZone para que Angular detecte los cambios
      this.ngZone.run(() => {
        this.detectionState.next({
          handDetected: true,
          fingerStates,
          currentGesture: gesture,
          landmarks
        });
      });
    } else {
      // No hay mano detectada
      this.ngZone.run(() => {
        const currentState = this.detectionState.value;
        // Solo actualizar si cambió el estado (para reducir actualizaciones)
        if (currentState.handDetected) {
          console.log('❌ Mano no detectada');
          this.detectionState.next({
            handDetected: false,
            fingerStates: {
              thumb: false,
              index: false,
              middle: false,
              ring: false,
              pinky: false
            },
            currentGesture: 'Ninguno',
            landmarks: null
          });
        }
      });
    }

    this.canvasCtx.restore();
  }

  private drawHand(landmarks: Landmark[]): void {
    const connections: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 4],     // Pulgar
      [0, 5], [5, 6], [6, 7], [7, 8],     // Índice
      [0, 9], [9, 10], [10, 11], [11, 12], // Medio
      [0, 13], [13, 14], [14, 15], [15, 16], // Anular
      [0, 17], [17, 18], [18, 19], [19, 20], // Meñique
      [5, 9], [9, 13], [13, 17]            // Palma
    ];

    this.canvasCtx.strokeStyle = '#00FF00';
    this.canvasCtx.lineWidth = 2;

    // Dibujar conexiones
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      this.canvasCtx.beginPath();
      this.canvasCtx.moveTo(startPoint.x * 640, startPoint.y * 480);
      this.canvasCtx.lineTo(endPoint.x * 640, endPoint.y * 480);
      this.canvasCtx.stroke();
    });

    // Dibujar landmarks
    landmarks.forEach((landmark) => {
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(landmark.x * 640, landmark.y * 480, 4, 0, 2 * Math.PI);
      this.canvasCtx.fillStyle = '#FF0000';
      this.canvasCtx.fill();
    });
  }

  private detectFingerStatesWithFingerpose(landmarks: Landmark[]): FingerState {
    // Calcular la curvatura de cada dedo manualmente usando los landmarks
    // fingerpose v0.1.0 no expone calculateFingerCurl directamente

    const thumb = this.isFingerExtended(landmarks, [1, 2, 3, 4]);   // Pulgar
    const index = this.isFingerExtended(landmarks, [5, 6, 7, 8]);   // Índice
    const middle = this.isFingerExtended(landmarks, [9, 10, 11, 12]); // Medio
    const ring = this.isFingerExtended(landmarks, [13, 14, 15, 16]); // Anular
    const pinky = this.isFingerExtended(landmarks, [17, 18, 19, 20]); // Meñique

    return { thumb, index, middle, ring, pinky };
  }

  private isFingerExtended(landmarks: Landmark[], fingerIndices: number[]): boolean {
    // Calcular si un dedo está extendido usando distancias
    // fingerIndices = [base, mcp, pip, tip] (4 puntos del dedo)

    if (fingerIndices.length !== 4) return false;

    const isThumb = fingerIndices[0] === 1;

    // El pulgar requiere lógica especial debido a su movimiento perpendicular
    if (isThumb) {
      return this.isThumbExtended(landmarks, fingerIndices);
    }

    const [base, mcp, pip, tip] = fingerIndices.map(i => landmarks[i]);

    // Calcular distancias
    const distance = (p1: Landmark, p2: Landmark): number => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dz = p1.z - p2.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };

    // Distancia total desde la base hasta la punta
    const totalDistance = distance(base, tip);

    // Distancia de cada segmento
    const segment1 = distance(base, mcp);
    const segment2 = distance(mcp, pip);
    const segment3 = distance(pip, tip);

    // Suma de distancias de segmentos (camino real)
    const segmentSum = segment1 + segment2 + segment3;

    // Si el dedo está extendido, la distancia directa debe ser cercana a la suma de segmentos
    // Ratio de extensión (1.0 = completamente extendido, < 0.85 = doblado)
    const extensionRatio = totalDistance / segmentSum;

    return extensionRatio > 0.85;
  }

  private isThumbExtended(landmarks: Landmark[], fingerIndices: number[]): boolean {
    // Detección especial para el pulgar
    const [cmc, mcp, ip, tip] = fingerIndices.map(i => landmarks[i]);

    // Referencias adicionales
    const indexMCP = landmarks[5];  // Base del índice
    const middleMCP = landmarks[9]; // Base del dedo medio

    const distance = (p1: Landmark, p2: Landmark): number => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dz = p1.z - p2.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };

    // Método 1: Distancia de la punta del pulgar al índice
    const tipToIndex = distance(tip, indexMCP);
    const ipToIndex = distance(ip, indexMCP);

    // Método 2: Distancia al centro de la palma
    const tipToPalm = distance(tip, middleMCP);
    const cmcToPalm = distance(cmc, middleMCP);

    // Calcular ratios
    const palmDistanceRatio = tipToPalm / cmcToPalm;

    // El pulgar está extendido si cumple AL MENOS UNA de estas condiciones:
    // 1. La punta está significativamente más lejos del índice que la articulación IP
    const condition1 = tipToIndex > ipToIndex * 1.4;

    // 2. La punta está más lejos del centro de la palma que la base
    // Cuando el pulgar está flexionado, ratio es ~0.16-0.19
    // Cuando está extendido, ratio debe ser > 0.8
    const condition2 = palmDistanceRatio > 0.3;

    const isExtended = condition1 || condition2;

    return isExtended;
  }

  private detectGesture(fingerStates: FingerState): string {
    const { thumb, index, middle, ring, pinky } = fingerStates;

    if (!thumb && !index && !middle && !ring && !pinky) {
      return '✊ Puño cerrado';
    } else if (thumb && index && middle && ring && pinky) {
      return '🖐️ Mano abierta';
    } else if (!thumb && index && middle && !ring && !pinky) {
      return '✌️ Victoria';
    } else if (!thumb && index && !middle && !ring && !pinky) {
      return '☝️ Índice';
    } else if (thumb && !index && !middle && !ring && pinky) {
      return '🤙 Shaka';
    } else if (thumb && !index && !middle && !ring && !pinky) {
      return '👍 Pulgar arriba';
    } else {
      return '🤚 Gesto personalizado';
    }
  }

  stop(): void {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.hands) {
      this.hands.close();
    }
  }

  getCurrentState(): HandDetectionState {
    return this.detectionState.value;
  }
}
