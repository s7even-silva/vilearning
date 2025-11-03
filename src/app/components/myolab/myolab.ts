import { Component, signal, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { WebcamImage, WebcamModule } from 'ngx-webcam';

// MediaPipe imports
import { Hands, HAND_CONNECTIONS, Results } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

@Component({
  selector: 'app-myolab',
  standalone: true,
  imports: [CommonModule, RouterOutlet, WebcamModule],
  templateUrl: './myolab.html',
  styleUrls: ['./myolab.scss']
})
export class Myolab implements OnDestroy {
  protected readonly title = signal('web-camera');

  premissionStatus: string = '';
  camData: any = null;
  captutedImage: any = '';           // la <img> que ya tenías
  trigger: Subject<void> = new Subject();

  get $trigger(): Observable<void>{
    return this.trigger.asObservable();
  }

  // --- MediaPipe ---
  private hands!: Hands;
  private offscreenCanvas!: HTMLCanvasElement;
  private offscreenCtx!: CanvasRenderingContext2D;

  // Estado UI detectado
  detectedHandness: string | null = null; // 'Right' | 'Left'
  handOpen: boolean | null = null; // true: abierta, false: cerrada, null: sin detección
  fingers = { thumb: false, index: false, middle: false, ring: false, pinky: false };

  constructor(private ngZone: NgZone) {
    this.initMediaPipe();
  }

  // Inicializa MediaPipe Hands (no usamos Camera de mediapipe porque usamos ngx-webcam)
  private initMediaPipe() {
    // crear canvas offscreen para dibujar y procesar
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    this.hands.setOptions({
      modelComplexity: 1,
      maxNumHands: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });

    // onResults se ejecuta cuando MediaPipe termina con la imagen
    this.hands.onResults((results: Results) => {
      // actualizar estado y la imagen resultante EN EL ANGULAR ZONE
      this.ngZone.run(() => this.handleResults(results));
    });
  }

  // Método original que pide permiso y guarda stream (lo dejamos igual)
  checkPremission(){
    navigator.mediaDevices.getUserMedia({video:{width:500,height:500}}).then((response)=>{
      this.premissionStatus = 'Allowed';
      this.camData = response;
      console.log(this.camData);
      console.log(this.premissionStatus);
    }).catch(err=>{
      this.premissionStatus = 'Not Allowed';
      console.log(this.premissionStatus);
    })
  }

  // Cuando ngx-webcam emite la imagen (WebcamImage), la procesamos con MediaPipe
  capture(event: WebcamImage){
    // mostramos la imagen cruda primero (como antes)
    this.captutedImage = event.imageAsDataUrl;

    const img = new Image();
    img.src = event.imageAsDataUrl;

    img.onload = async () => {
      // ajustar canvas offscreen al tamaño real de la imagen
      this.offscreenCanvas.width = img.width;
      this.offscreenCanvas.height = img.height;

      // dibujar la imagen original en el canvas (base para dibujo de landmarks)
      this.offscreenCtx.clearRect(0, 0, img.width, img.height);
      this.offscreenCtx.drawImage(img, 0, 0, img.width, img.height);

      // enviar la imagen a MediaPipe
      try {
        await this.hands.send({ image: img });
        // nota: el resultado llegará asíncronamente a handleResults
      } catch (err) {
        console.error('Error enviando la imagen a MediaPipe Hands:', err);
      }
    };

    img.onerror = (err) => {
      console.error('Error cargando imagen desde dataURL', err);
    };
  }

  // Método que dispara ngx-webcam a través del Subject (igual que antes)
  captureImage(){
    this.trigger.next();
  }

  // Procesa los resultados de MediaPipe, dibuja sobre el offscreen canvas y actualiza estados
  private handleResults(results: Results) {
    // limpiar canvas (ya tiene la imagen base dibujada en capture), pero por seguridad la refrescamos:
    // Si results.image está disponible, dibujarla; en nuestro flujo usamos la imagen del offscreen
    // Simplemente dejamos ahí lo que ya puso capture() y agregamos overlays.
    // Limpiar solo las anotaciones (re-dibujar la imagen base):
    // Para mantener simplicidad, asumimos que offscreen ya contiene la imagen; si no lo hiciera,
    // podríamos volver a dibujarla desde results.image (si existe).
    const w = this.offscreenCanvas.width;
    const h = this.offscreenCanvas.height;
    // redibuja la imagen base (no siempre necesario porque ya dibujamos antes de enviar)
    // this.offscreenCtx.drawImage(...)

    // dibujar landmarks si hay manos
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // toma la primera mano
      const landmarks = results.multiHandLandmarks[0];
      // dibujar conexiones y puntos
      drawConnectors(this.offscreenCtx, landmarks, HAND_CONNECTIONS);
      drawLandmarks(this.offscreenCtx, landmarks, { radius: 4 });

      // obtener handedness si existe
      const handedness = results.multiHandedness && results.multiHandedness[0] && results.multiHandedness[0].label
        ? results.multiHandedness[0].label
        : null;

      // clasificar dedos (devuelve objeto con booleans)
      const fingerStates = this.classifyFingers(landmarks, handedness);
      const openCount = Object.values(fingerStates).filter(v => v).length;

      // actualizar UI state
      this.detectedHandness = handedness;
      this.fingers = fingerStates;
      this.handOpen = openCount >= 4;

    } else {
      // no detectada
      this.detectedHandness = null;
      this.fingers = { thumb: false, index: false, middle: false, ring: false, pinky: false };
      this.handOpen = null;
    }

    // actualizar la imagen que muestra tu <img> con el canvas anotado
    try {
      this.captutedImage = this.offscreenCanvas.toDataURL('image/png');
    } catch (err) {
      console.error('Error generando dataURL del canvas', err);
    }
  }

  /**
   * classifyFingers:
   * - landmarks: array de 21 puntos normalizados {x,y,z} (x,y en 0..1)
   * - handedness: "Right" | "Left" | null
   * Regresa true cuando el dedo está extendido.
   */
  private classifyFingers(landmarks: Array<{x:number,y:number,z:number}>, handedness: string | null) {
    if (!landmarks || landmarks.length < 21) {
      return { thumb: false, index: false, middle: false, ring: false, pinky: false };
    }

    // Helper: para índices/medio/anular/meñique comparamos tip.y con pip.y
    const isFingerExtended = (tipIdx: number, pipIdx: number) => {
      const tip = landmarks[tipIdx];
      const pip = landmarks[pipIdx];
      if (!tip || !pip) return false;
      // ojo: y aumenta hacia abajo en la imagen, por eso tip.y < pip.y => dedo hacia arriba (extendido)
      return tip.y < pip.y;
    };

    // Pulgar: heurística en el eje X, depende de la mano
    const thumbTip = landmarks[4];
    const thumbMcp = landmarks[2]; // usar MCP o CMC según prefieras
    let thumbExtended = false;
    if (thumbTip && thumbMcp) {
      if (handedness === 'Right') {
        // para mano derecha, pulgar "hacia la izquierda" en la imagen suele tener tip.x < mcp.x
        thumbExtended = thumbTip.x < thumbMcp.x;
      } else if (handedness === 'Left') {
        thumbExtended = thumbTip.x > thumbMcp.x;
      } else {
        // sin handedness, usar comparación con índice (5)
        const indexMcp = landmarks[5];
        if (indexMcp) {
          // si la punta del pulgar está separada hacia un lado respecto al índice
          thumbExtended = Math.abs(thumbTip.x - indexMcp.x) > 0.05 && Math.abs(thumbTip.x - thumbMcp.x) > 0.01 && (thumbTip.x < indexMcp.x);
        } else {
          thumbExtended = false;
        }
      }
    }

    const indexExtended = isFingerExtended(8, 6);
    const middleExtended = isFingerExtended(12, 10);
    const ringExtended = isFingerExtended(16, 14);
    const pinkyExtended = isFingerExtended(20, 18);

    return {
      thumb: !!thumbExtended,
      index: !!indexExtended,
      middle: !!middleExtended,
      ring: !!ringExtended,
      pinky: !!pinkyExtended
    };
  }

  // cleanup
  ngOnDestroy(): void {
    try {
      this.hands?.close?.();
    } catch (e) { /* ignore */ }
  }
}
