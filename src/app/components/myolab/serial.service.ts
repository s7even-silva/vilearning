import { Injectable, OnDestroy } from '@angular/core';
import { HandDetectionService, FingerState } from './hand-detection.service';
import { Subject, interval, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SerialService implements OnDestroy {
  // Constante para el ángulo de dedo contraído
  private readonly CONTRACTED_ANGLE = 150;
  private readonly EXTENDED_ANGLE = 0;
  private readonly SEND_INTERVAL_MS = 1000; // Enviar cada 1 segundo
  private readonly PORT_CHECK_INTERVAL_MS = 10000; // Revisar puerto cada 10 segundos

  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter | null = null;
  private isConnected = false;
  private destroy$ = new Subject<void>();
  private currentFingerStates: FingerState | null = null;

  constructor(private handDetectionService: HandDetectionService) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Suscribirse a los cambios de estado de los dedos
    this.handDetectionService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.handDetected) {
          this.currentFingerStates = state.fingerStates;
        } else {
          this.currentFingerStates = null;
        }
      });

    // Intentar conectar al puerto serial
    await this.connectToSerialPort();

    // Enviar datos cada segundo
    interval(this.SEND_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.sendSerialData();
      });

    // Revisar conexión cada 10 segundos si no está conectado
    interval(this.PORT_CHECK_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        if (!this.isConnected) {
          console.log('🔌 Puerto serial no disponible. Intentando reconectar...');
          await this.connectToSerialPort();
        }
      });
  }

  private async connectToSerialPort(): Promise<void> {
    try {
      // Verificar si el navegador soporta Web Serial API
      if (!('serial' in navigator)) {
        console.error('❌ Web Serial API no soportada en este navegador');
        return;
      }

      // Intentar obtener puertos previamente autorizados
      const ports = await (navigator as any).serial.getPorts();

      if (ports.length > 0) {
        this.port = ports[0];
      } else {
        // Si no hay puertos autorizados, esperar a que el usuario seleccione uno
        console.log('⚠️ No hay puertos seriales autorizados. Use requestSerialPort() para seleccionar uno.');
        return;
      }

      // Verificar que el puerto no sea null antes de abrir
      if (!this.port) {
        console.error('❌ Puerto serial es null');
        return;
      }

      // Abrir el puerto serial
      await this.port.open({ baudRate: 115200 });

      // Obtener el writer para escribir datos
      if (this.port.writable) {
        this.writer = this.port.writable.getWriter();
        this.isConnected = true;
        console.log('✅ Conectado al puerto serial exitosamente');
      }
    } catch (error) {
      console.error('❌ Error al conectar al puerto serial:', error);
      this.isConnected = false;
      this.port = null;
      this.writer = null;
    }
  }

  /**
   * Método público para solicitar acceso al puerto serial
   * Debe ser llamado desde un evento de usuario (ej: click en botón)
   */
  async requestSerialPort(): Promise<void> {
    try {
      if (!('serial' in navigator)) {
        console.error('❌ Web Serial API no soportada en este navegador');
        return;
      }

      // Solicitar al usuario que seleccione un puerto
      this.port = await (navigator as any).serial.requestPort();

      // Verificar que el puerto no sea null
      if (!this.port) {
        console.error('❌ No se seleccionó ningún puerto');
        return;
      }

      // Abrir el puerto
      await this.port.open({ baudRate: 9600 });

      // Obtener el writer
      if (this.port.writable) {
        this.writer = this.port.writable.getWriter();
        this.isConnected = true;
        console.log('✅ Puerto serial seleccionado y conectado');
      }
    } catch (error) {
      console.error('❌ Error al solicitar puerto serial:', error);
    }
  }

  private sendSerialData(): void {
    if (!this.currentFingerStates) {
      // No hay datos de mano detectada, no enviar nada
      return;
    }

    // Mapear los dedos a sus números
    const fingerMap = [
      { name: 'pulgar', number: 1, extended: this.currentFingerStates.thumb },
      { name: 'índice', number: 2, extended: this.currentFingerStates.index },
      { name: 'medio', number: 3, extended: this.currentFingerStates.middle },
      { name: 'anular', number: 4, extended: this.currentFingerStates.ring },
      { name: 'meñique', number: 5, extended: this.currentFingerStates.pinky }
    ];

    // Construir el comando serial
    const commands = fingerMap.map(finger => {
      const angle = finger.extended ? this.EXTENDED_ANGLE : this.CONTRACTED_ANGLE;
      return `${finger.number},${angle}`;
    });

    const serialCommand = commands.join(';');

    // Imprimir en consola
    console.log('📡 Enviando comando serial:', serialCommand);

    // Enviar por puerto serial si está conectado
    if (this.isConnected && this.writer) {
      this.sendToPort(serialCommand);
    } else {
      console.log('⚠️ Puerto serial no disponible. Comando no enviado.');
    }
  }

  private async sendToPort(data: string): Promise<void> {
    if (!this.writer) return;

    try {
      // Convertir string a bytes
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(data + '\n'); // Agregar salto de línea

      // Enviar los datos
      await this.writer.write(dataBytes);
    } catch (error) {
      console.error('❌ Error al enviar datos por puerto serial:', error);
      this.isConnected = false;

      // Intentar liberar el writer
      try {
        await this.writer?.releaseLock();
        this.writer = null;
      } catch (releaseError) {
        console.error('❌ Error al liberar writer:', releaseError);
      }
    }
  }

  /**
   * Método para desconectar manualmente el puerto serial
   */
  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        await this.writer.releaseLock();
        this.writer = null;
      }

      if (this.port) {
        await this.port.close();
        this.port = null;
      }

      this.isConnected = false;
      console.log('🔌 Puerto serial desconectado');
    } catch (error) {
      console.error('❌ Error al desconectar puerto serial:', error);
    }
  }

  /**
   * Obtener el estado de conexión
   */
  isPortConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Cambiar el ángulo de contracción
   */
  setContractedAngle(angle: number): void {
    if (angle >= 0 && angle <= 180) {
      (this as any).CONTRACTED_ANGLE = angle;
      console.log(`✅ Ángulo de contracción actualizado a: ${angle}°`);
    } else {
      console.error('❌ El ángulo debe estar entre 0 y 180 grados');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
