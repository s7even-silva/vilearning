# Configuración Centralizada de ViLab

Este documento explica cómo funciona el sistema de configuración centralizada de la aplicación.

## 📋 Archivos de Configuración

### 1. Variables SCSS (`src/styles/_variables.scss`)

Contiene todas las variables de estilo globales:

#### Colores Principales
```scss
$primary-color: #c8102e;      // Color principal de la marca
$primary-dark: #8b0a1e;       // Versión oscura del color principal
$primary-light: #e81839;      // Versión clara del color principal
```

#### Colores Secundarios
```scss
$secondary-color: #2c3e50;    // Color secundario
$secondary-dark: #1a252f;     // Versión oscura
$secondary-light: #34495e;    // Versión clara
```

#### Colores de Fondo
```scss
$light-bg: #f8f9fa;           // Fondo claro
$white-bg: #ffffff;           // Fondo blanco
$dark-bg: #2c3e50;            // Fondo oscuro
```

#### Colores de Estado
```scss
$success-color: #28a745;      // Éxito
$warning-color: #ffc107;      // Advertencia
$danger-color: #dc3545;       // Error
$info-color: #17a2b8;         // Información
```

#### Otras Variables
- Sombras: `$shadow-sm`, `$shadow-md`, `$shadow-lg`
- Radios de borde: `$border-radius-sm`, `$border-radius-md`, `$border-radius-lg`
- Espaciado: `$spacing-xs` a `$spacing-xl`
- Tipografía: `$font-family`, `$font-size-sm` a `$font-size-xxl`
- Transiciones: `$transition-fast`, `$transition-normal`, `$transition-slow`

### 2. Constantes TypeScript (`src/app/config/app.config.ts`)

Contiene todas las constantes de la aplicación:

#### Información de la Aplicación
```typescript
appName: 'ViLab'
appFullName: 'ViLab - Plataforma de Aprendizaje Virtual'
appDescription: 'Plataforma de aprendizaje virtual con laboratorios interactivos'
appVersion: '1.0.0'
```

#### Información de Contacto
```typescript
supportEmail: 'soporte@vilab.com'
contactPhone: '+1 234 567 890'
```

#### Configuración del Laboratorio
```typescript
lab: {
  name: 'MyoLab'
  description: 'Laboratorio de Detección de Manos con MediaPipe'
  videoWidth: 640
  videoHeight: 480
  minDetectionConfidence: 0.5
  minTrackingConfidence: 0.5
}
```

#### Colores para TypeScript/Canvas
```typescript
colors: {
  primary: '#c8102e'
  primaryDark: '#8b0a1e'
  primaryLight: '#e81839'
  secondary: '#2c3e50'
  // ...
}
```

## 🎨 Cómo Usar las Variables

### En Archivos SCSS

1. Importa las variables al inicio del archivo:
```scss
@import '../../../styles/variables';
```

2. Usa las variables en tu código:
```scss
.mi-clase {
  background-color: $primary-color;
  color: $text-white;
  padding: $spacing-md;
  border-radius: $border-radius-sm;
  transition: $transition-normal;
}
```

### En Archivos TypeScript

1. Importa la configuración:
```typescript
import { APP_CONFIG } from '../../config/app.config';
```

2. Usa las constantes:
```typescript
export class MiComponente {
  appName = APP_CONFIG.appName;
  primaryColor = APP_CONFIG.colors.primary;

  // En métodos
  method() {
    console.log(APP_CONFIG.appDescription);
  }
}
```

### En Templates HTML

1. Expón las variables en el componente TypeScript:
```typescript
export class MiComponente {
  appName = APP_CONFIG.appName;
}
```

2. Úsalas en el template:
```html
<h1>{{ appName }}</h1>
```

## 🔧 Cómo Modificar los Valores

### Para Cambiar el Nombre de la Aplicación

Edita `src/app/config/app.config.ts`:
```typescript
appName: 'TuNuevoNombre',
```

El cambio se reflejará automáticamente en:
- Header (logo)
- Footer (título y copyright)
- Título de la página

### Para Cambiar el Color Principal

Edita `src/styles/_variables.scss`:
```scss
$primary-color: #tu-nuevo-color;
$primary-dark: #version-oscura;
$primary-light: #version-clara;
```

Y también en `src/app/config/app.config.ts` para uso en TypeScript:
```typescript
colors: {
  primary: '#tu-nuevo-color',
  primaryDark: '#version-oscura',
  primaryLight: '#version-clara',
  // ...
}
```

El cambio se reflejará automáticamente en:
- Botones
- Enlaces
- Detección de manos (canvas)
- Bordes y elementos interactivos
- Todos los componentes que usen `$primary-color`

## 📦 Archivos Actualizados

Los siguientes archivos ya están configurados para usar el sistema centralizado:

### SCSS
- ✅ `src/styles.scss`
- ✅ `src/app/components/home/home.scss`
- ✅ `src/app/components/layout/layout.scss`
- ✅ `src/app/components/courses/courses.scss`
- ✅ `src/app/components/myolab/myolab.scss`
- ✅ `src/app/components/myolab/lab-workspace/lab-workspace.scss`
- ✅ `src/app/components/myolab/quiz/quiz.scss`
- ✅ `src/app/components/myolab/results/results.scss`

### TypeScript/HTML
- ✅ `src/app/components/layout/layout.ts` y `layout.html`
- ✅ `src/app/components/myolab/hand-detection.service.ts`
- ✅ `src/index.html`

## 🎯 Beneficios

1. **Consistencia**: Todos los colores y textos son consistentes en toda la aplicación
2. **Mantenibilidad**: Cambiar un valor en un solo lugar actualiza toda la app
3. **Escalabilidad**: Fácil agregar nuevas variables y constantes
4. **Documentación**: Todas las configuraciones están en un lugar centralizado
5. **Tipado**: TypeScript proporciona autocompletado para las constantes

## 📝 Ejemplos de Uso

### Ejemplo 1: Nuevo Componente con Estilos
```scss
// mi-componente.scss
@import '../../../styles/variables';

.mi-componente {
  background: $light-bg;
  color: $text-dark;
  padding: $spacing-lg;
  border: 1px solid $primary-color;
  border-radius: $border-radius-md;

  &:hover {
    background: $primary-color;
    color: $text-white;
    transition: $transition-normal;
  }
}
```

### Ejemplo 2: Componente con Configuración
```typescript
// mi-componente.ts
import { Component } from '@angular/core';
import { APP_CONFIG } from '../../config/app.config';

@Component({
  selector: 'app-mi-componente',
  templateUrl: './mi-componente.html'
})
export class MiComponente {
  appName = APP_CONFIG.appName;
  supportEmail = APP_CONFIG.supportEmail;
}
```

```html
<!-- mi-componente.html -->
<div class="contact">
  <h2>Contacta con {{ appName }}</h2>
  <p>Email: {{ supportEmail }}</p>
</div>
```

## 🚀 Próximos Pasos

Para agregar nuevas configuraciones:

1. **Para estilos**: Agrega la variable en `src/styles/_variables.scss`
2. **Para constantes**: Agrega la propiedad en `src/app/config/app.config.ts`
3. **Documenta**: Actualiza este archivo README con la nueva configuración

---

**Última actualización**: 2025-11-05
