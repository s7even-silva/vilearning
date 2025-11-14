import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CameraStreamState {
  url: string;
  isLoaded: boolean;
  hasError: boolean;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CameraStreamService {
  // Configuración para desarrollo local
  private readonly LOCAL_STREAM_PORT = 8080;
  private readonly LOCAL_STREAM_PATH = '/?action=stream';

  // Configuración para producción (Cloudflare Tunnel)
  private readonly PRODUCTION_STREAM_SUBDOMAIN = 'camera';
  private readonly PRODUCTION_STREAM_PATH = '/?action=stream';

  private state$ = new BehaviorSubject<CameraStreamState>({
    url: '',
    isLoaded: false,
    hasError: false
  });

  constructor() {
    this.initializeStreamUrl();
  }

  /**
   * Inicializa la URL del stream basándose en el entorno
   * - Desarrollo local: http://localhost:8080/?action=stream
   * - Producción (vlaboratory.org): https://camera.vlaboratory.org/?action=stream
   */
  private initializeStreamUrl(): void {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    let streamUrl: string;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Desarrollo local: HTTP sin cifrar en puerto 8080
      streamUrl = `http://localhost:${this.LOCAL_STREAM_PORT}${this.LOCAL_STREAM_PATH}`;
      console.log('[CameraStreamService] Modo desarrollo local');
    } else {
      // Producción: HTTPS a través de Cloudflare Tunnel
      // Usa el mismo protocolo que la aplicación (HTTPS)
      const baseDomain = this.extractBaseDomain(hostname);
      streamUrl = `${protocol}//${this.PRODUCTION_STREAM_SUBDOMAIN}.${baseDomain}${this.PRODUCTION_STREAM_PATH}`;
      console.log('[CameraStreamService] Modo producción con Cloudflare Tunnel');
    }

    console.log('[CameraStreamService] Stream URL configurada:', streamUrl);

    this.state$.next({
      url: streamUrl,
      isLoaded: false,
      hasError: false
    });
  }

  /**
   * Extrae el dominio base del hostname
   * Ej: "vlaboratory.org" o "www.vlaboratory.org" → "vlaboratory.org"
   */
  private extractBaseDomain(hostname: string): string {
    // Si el hostname es exactamente el dominio base, retornarlo
    if (hostname === 'vlaboratory.org') {
      return hostname;
    }

    // Si tiene subdominio (ej: www.vlaboratory.org), extraer el dominio base
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      // Tomar los últimos 2 segmentos (dominio.tld)
      return parts.slice(-2).join('.');
    }

    // Fallback: retornar el hostname completo
    return hostname;
  }

  /**
   * Obtiene el estado del stream como Observable
   */
  public getState(): Observable<CameraStreamState> {
    return this.state$.asObservable();
  }

  /**
   * Obtiene la URL del stream
   */
  public getStreamUrl(): string {
    return this.state$.value.url;
  }

  /**
   * Marca el stream como cargado exitosamente
   */
  public onStreamLoaded(): void {
    this.state$.next({
      ...this.state$.value,
      isLoaded: true,
      hasError: false,
      errorMessage: undefined
    });
  }

  /**
   * Marca el stream como fallido
   */
  public onStreamError(error?: string): void {
    this.state$.next({
      ...this.state$.value,
      isLoaded: false,
      hasError: true,
      errorMessage: error || 'No se pudo cargar el stream de la cámara'
    });
  }

  /**
   * Reinicia el estado del stream (útil para retry)
   */
  public reset(): void {
    this.state$.next({
      ...this.state$.value,
      isLoaded: false,
      hasError: false,
      errorMessage: undefined
    });
  }

  /**
   * Verifica si el stream está disponible haciendo una petición HEAD
   */
  public async checkStreamAvailability(): Promise<boolean> {
    try {
      const response = await fetch(this.getStreamUrl(), {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      console.error('Stream no disponible:', error);
      return false;
    }
  }
}
