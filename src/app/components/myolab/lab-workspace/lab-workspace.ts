import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandDetectionService, HandDetectionState } from '../hand-detection.service';
import { CameraStreamService, CameraStreamState } from '../camera-stream.service';
import { WebSocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lab-workspace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lab-workspace.html',
  styleUrls: ['./lab-workspace.scss']
})
export class LabWorkspace implements AfterViewInit, OnDestroy {
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('usbCamera') usbCamera!: ElementRef<HTMLImageElement>;
  @Output() onFinish = new EventEmitter<void>();

  detectionState: HandDetectionState = {
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
  };

  // USB Camera streaming
  cameraStreamState: CameraStreamState = {
    url: '',
    isLoaded: false,
    hasError: false
  };

  private subscription?: Subscription;
  private cameraSubscription?: Subscription;

  constructor(
    private handDetectionService: HandDetectionService,
    private cdr: ChangeDetectorRef,
    private websocketService: WebSocketService,
    private cameraStreamService: CameraStreamService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.handDetectionService.initialize(
        this.video.nativeElement,
        this.canvas.nativeElement
      );

      // Suscribirse a los cambios de estado de detección de manos
      this.subscription = this.handDetectionService.state$.subscribe(state => {
        this.detectionState = state;
        this.cdr.detectChanges(); // Forzar detección de cambios
      });

      // Suscribirse al estado del stream de la cámara USB
      this.cameraSubscription = this.cameraStreamService.getState().subscribe(state => {
        this.cameraStreamState = state;
        this.cdr.detectChanges();
      });

      // Conectar WebSocket automáticamente
      this.websocketService.connect();
    } catch (error) {
      alert('Por favor, permite el acceso a la cámara para usar el laboratorio.');
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.cameraSubscription) {
      this.cameraSubscription.unsubscribe();
    }
    this.handDetectionService.stop();
    this.websocketService.disconnect();
  }

  finishLab(): void {
    this.onFinish.emit();
  }

  // Métodos para manejar el stream de la cámara USB
  onCameraLoad(): void {
    this.cameraStreamService.onStreamLoaded();
  }

  onCameraError(): void {
    this.cameraStreamService.onStreamError();
  }

  retryCameraStream(): void {
    this.cameraStreamService.reset();
  }
}
