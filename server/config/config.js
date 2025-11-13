/**
 * Configuración del servidor WebSocket
 */

module.exports = {
  // Configuración del servidor WebSocket
  websocket: {
    port: process.env.WS_PORT || 3001,
    host: process.env.WS_HOST || '0.0.0.0'  // Escucha en todas las interfaces de red
  },

  // Configuración de motores
  motor: {
    contractedAngle: 150,  // Ángulo cuando el dedo está contraído
    extendedAngle: 0,      // Ángulo cuando el dedo está extendido
    sendInterval: 1000     // Intervalo de envío en milisegundos (actualmente no usado en servidor)
  },

  // Configuración general
  app: {
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};
