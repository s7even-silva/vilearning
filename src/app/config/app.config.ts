// ============================================
// CONFIGURACIÓN GLOBAL DE LA APLICACIÓN
// ============================================
// Modifica estas constantes para cambiar los textos en toda la aplicación

export const APP_CONFIG = {
  // Información de la aplicación
  appName: 'ViLab',
  appFullName: 'ViLab - Plataforma de Aprendizaje Virtual',
  appDescription: 'Plataforma de aprendizaje virtual con laboratorios interactivos',
  appVersion: '1.0.0',

  // Información de contacto
  supportEmail: 'soporte@vilab.com',
  contactPhone: '+1 234 567 890',

  // URLs y redes sociales
  websiteUrl: 'https://vilab.com',
  facebookUrl: 'https://facebook.com/vilab',
  twitterUrl: 'https://twitter.com/vilab',
  linkedinUrl: 'https://linkedin.com/company/vilab',

  // Configuración de la plataforma
  defaultLanguage: 'es',
  itemsPerPage: 12,
  maxFileUploadSize: 10 * 1024 * 1024, // 10MB

  // Textos de la interfaz
  texts: {
    welcomeMessage: 'Bienvenido a ViLab',
    loginTitle: 'Iniciar Sesión',
    registerTitle: 'Registrarse',
    coursesTitle: 'Cursos',
    myCoursesTitle: 'Mis Cursos',
    labTitle: 'Laboratorio Virtual',
    profileTitle: 'Mi Perfil',
    settingsTitle: 'Configuración',
    logoutText: 'Cerrar Sesión',
  },

  // Configuración del laboratorio
  lab: {
    name: 'MyoLab',
    description: 'Laboratorio de Detección de Manos con MediaPipe',
    videoWidth: 640,
    videoHeight: 480,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  },

  // Colores (para uso en TypeScript/Canvas)
  colors: {
    primary: '#c8102e',
    primaryDark: '#8b0a1e',
    primaryLight: '#e81839',
    secondary: '#2c3e50',
    lightBg: '#f8f9fa',
    white: '#ffffff',
    textDark: '#333333',
    textLight: '#666666',
  },
} as const;

// Tipo para autocompletado
export type AppConfig = typeof APP_CONFIG;
