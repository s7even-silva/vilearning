import { Injectable, OnDestroy } from '@angular/core';
import { HandDetectionService, FingerState } from '../components/myolab/hand-detection.service';
import { Subject, BehaviorSubject, interval, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  // Constantes para ángulos de servos
  private readonly CONTRACTED_ANGLE = 85;
  private readonly EXTENDED_ANGLE = 10;
  private readonly SEND_INTERVAL_MS = 1000; // Enviar cada 1 segundo
  private readonly RECONNECT_INTERVAL_MS = 10000; // Reintentar conexión cada 10 segundos
  private readonly PING_INTERVAL_MS = 60000; // Enviar ping cada 60 segundos (para Cloudflare)

  // WebSocket
  private socket: WebSocket | null = null;
  private isConnected = false;

  // URL del servidor WebSocket
  private wsUrl: string;

  // Observables para estado
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private esp32Status$ = new BehaviorSubject<boolean>(false);

  // Control de destrucción
  private destroy$ = new Subject<void>();

  // Estado actual de dedos
  private currentFingerStates: FingerState | null = null;

  constructor(private handDetectionService: HandDetectionService) {
    // Configurar URL del WebSocket
    // En desarrollo: ws://localhost:3001
    // En producción: wss://tu-dominio.com (o ws://raspberry-ip:3001)
    this.wsUrl = this.getWebSocketUrl();

    this.initialize();
  }

  /**
   * Obtiene la URL del WebSocket según el entorno
   */
  private getWebSocketUrl(): string {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // En desarrollo local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:3001?client=frontend';
    }

    // En producción con Cloudflare Tunnel
    // Subdominio dedicado: wss://ws.vlaboratory.org
    if (hostname === 'vlaboratory.org') {
      return 'https://ws.vlaboratory.org?client=frontend';
    }

    // Fallback genérico para otros dominios
    return `${protocol}//ws.${hostname}?client=frontend`;
  }

  /**
   * Inicializa el servicio
   */
  private initialize(): void {
    // Suscribirse a cambios de estado de dedos
    this.handDetectionService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.handDetected) {
          this.currentFingerStates = state.fingerStates;
        } else {
          this.currentFingerStates = null;
        }
      });

    // Conectar al WebSocket
    this.connect();

    // Enviar datos cada segundo
    interval(this.SEND_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.sendFingerData();
      });

    // Verificar reconexión cada 10 segundos
    interval(this.RECONNECT_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.isConnected) {
          this.connect();
        }
      });

    // Enviar ping cada 60 segundos para mantener conexión viva
    interval(this.PING_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.sendPing();
      });
  }

  /**
   * Conecta al servidor WebSocket
   */
  public connect(): void {
    // Si ya está conectado o intentando conectar, no hacer nada
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        this.handleOpen();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.socket.onerror = (error) => {
        this.handleError(error);
      };

      this.socket.onclose = () => {
        this.handleClose();
      };

    } catch (error) {
      this.isConnected = false;
      this.connectionStatus$.next(false);
    }
  }

  /**
   * Maneja la apertura de conexión WebSocket
   */
  private handleOpen(): void {
    this.isConnected = true;
    this.connectionStatus$.next(true);
  }

  /**
   * Maneja mensajes recibidos del servidor
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // Manejar diferentes tipos de mensajes
      switch (data.type) {
        case 'esp32_status':
          // Actualizar estado del ESP32
          this.esp32Status$.next(data.connected);
          break;

        case 'pong':
          // Respuesta a ping
          break;

        case 'error':
          break;

        default:
          break;
      }
    } catch (error) {
      // Error al parsear JSON
    }
  }

  /**
   * Maneja errores de WebSocket
   */
  private handleError(error: Event): void {
    this.isConnected = false;
    this.connectionStatus$.next(false);
  }

  /**
   * Maneja el cierre de conexión
   */
  private handleClose(): void {
    this.isConnected = false;
    this.connectionStatus$.next(false);
    this.esp32Status$.next(false);
  }

  /**
   * Envía datos de estado de dedos al servidor
   */
  private sendFingerData(): void {
    if (!this.currentFingerStates || !this.isConnected || !this.socket) {
      return;
    }

    // Construir comando en el mismo formato que serial.service
    const fingerMap = [
      { number: 1, extended: this.currentFingerStates.thumb },
      { number: 2, extended: this.currentFingerStates.index },
      { number: 3, extended: this.currentFingerStates.middle },
      { number: 4, extended: this.currentFingerStates.ring },
      { number: 5, extended: this.currentFingerStates.pinky }
    ];

    const commands = fingerMap.map(finger => {
      const angle = finger.extended ? this.EXTENDED_ANGLE : this.CONTRACTED_ANGLE;
      return `${finger.number},${angle}`;
    });

    const commandData = commands.join(';');

    // Construir mensaje JSON
    const message = {
      type: 'motor_command',
      data: commandData,
      timestamp: Date.now()
    };

    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      this.isConnected = false;
      this.connectionStatus$.next(false);
    }
  }

  /**
   * Envía un ping al servidor para mantener conexión viva
   */
  private sendPing(): void {
    if (!this.isConnected || !this.socket) {
      return;
    }

    const message = {
      type: 'ping',
      timestamp: Date.now()
    };

    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      // Error al enviar ping
    }
  }

  /**
   * Desconecta del servidor WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnected = false;
    this.connectionStatus$.next(false);
    this.esp32Status$.next(false);
  }

  /**
   * Obtiene el observable del estado de conexión
   */
  public getConnectionStatus$() {
    return this.connectionStatus$.asObservable();
  }

  /**
   * Obtiene el observable del estado del ESP32
   */
  public getESP32Status$() {
    return this.esp32Status$.asObservable();
  }

  /**
   * Obtiene el estado actual de conexión
   */
  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Obtiene el estado actual del ESP32
   */
  public isESP32Connected(): boolean {
    return this.esp32Status$.value;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
