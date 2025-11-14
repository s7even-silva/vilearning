import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { APP_CONFIG } from '../../config/app.config';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss']
})
export class Layout {
  // Configuración de la aplicación
  appName = APP_CONFIG.appName;
  appDescription = APP_CONFIG.appDescription;
  currentYear = new Date().getFullYear();

  constructor(public router: Router) {}

  isActive(route: string): boolean {
    // Extraer la ruta sin el fragmento (sin el #)
    const urlWithoutFragment = this.router.url.split('#')[0];
    const urlWithoutQuery = this.router.url.split('?')[0];

    return urlWithoutFragment === route ||
           urlWithoutFragment.startsWith(route + '/') ||
           urlWithoutQuery === route ||
           urlWithoutQuery.startsWith(route + '/');
  }
}