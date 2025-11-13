/**
 * Servidor WebSocket para ViLearning
 * Actúa como relay entre el frontend Angular y el ESP32
 */

const WebSocket = require('ws');
const config = require('./config/config');

// Referencias a clientes conectados
let esp32Client = null;
const frontendClients = new Set();

// Crear servidor WebSocket
const wss = new WebSocket.Server({
  port: config.websocket.port,
  host: config.websocket.host
});

console.log(`Servidor WebSocket escuchando en ${config.websocket.host}:${config.websocket.port}`);

/**
 * Maneja nuevas conexiones WebSocket
 */
wss.on('connection', (ws, req) => {
  // Obtener query params de la URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const clientType = url.searchParams.get('client');

  console.log(`Nueva conexión recibida. Tipo: ${clientType || 'desconocido'}`);

  // Identificar el tipo de cliente
  if (clientType === 'esp32') {
    handleESP32Connection(ws);
  } else {
    handleFrontendConnection(ws);
  }

  // Manejar mensajes entrantes
  ws.on('message', (message) => {
    handleMessage(ws, message, clientType);
  });

  // Manejar cierre de conexión
  ws.on('close', () => {
    handleDisconnection(ws, clientType);
  });

  // Manejar errores
  ws.on('error', (error) => {
    console.error('Error en conexión WebSocket:', error.message);
  });
});

/**
 * Maneja la conexión de un cliente ESP32
 */
function handleESP32Connection(ws) {
  if (esp32Client !== null) {
    console.log('Ya existe un ESP32 conectado. Reemplazando conexión anterior.');
    esp32Client.close(1000, 'New ESP32 connected');
  }

  esp32Client = ws;
  console.log('ESP32 conectado exitosamente');

  // Notificar a todos los frontends que el ESP32 está conectado
  broadcastToFrontends({
    type: 'esp32_status',
    connected: true,
    timestamp: Date.now()
  });
}

/**
 * Maneja la conexión de un cliente frontend
 */
function handleFrontendConnection(ws) {
  frontendClients.add(ws);
  console.log(`Frontend conectado. Total de frontends: ${frontendClients.size}`);

  // Enviar estado actual del ESP32
  const esp32Connected = esp32Client !== null && esp32Client.readyState === WebSocket.OPEN;
  ws.send(JSON.stringify({
    type: 'esp32_status',
    connected: esp32Connected,
    timestamp: Date.now()
  }));
}

/**
 * Maneja mensajes recibidos de los clientes
 */
function handleMessage(ws, message, clientType) {
  try {
    const data = JSON.parse(message);

    console.log(`Mensaje recibido de ${clientType}:`, data.type);

    // Si es un comando de motor desde el frontend
    if (clientType === 'frontend' && data.type === 'motor_command') {
      // Debug: verificar estado del ESP32
      console.log('DEBUG - esp32Client existe?', esp32Client !== null);
      console.log('DEBUG - esp32Client.readyState:', esp32Client ? esp32Client.readyState : 'N/A');
      console.log('DEBUG - WebSocket.OPEN:', WebSocket.OPEN);

      // Reenviar al ESP32
      if (esp32Client && esp32Client.readyState === WebSocket.OPEN) {
        esp32Client.send(JSON.stringify(data));
        console.log('Comando reenviado al ESP32:', data.data);
      } else {
        console.log('ESP32 no conectado. Comando no enviado.');
        // Notificar al frontend que el ESP32 no está disponible
        ws.send(JSON.stringify({
          type: 'error',
          message: 'ESP32 no conectado',
          timestamp: Date.now()
        }));
      }
    }

    // Si es un estado de motor desde el ESP32
    else if (clientType === 'esp32' && data.type === 'motor_status') {
      // Reenviar a todos los frontends
      broadcastToFrontends(data);
      console.log('Estado de motor reenviado a frontends');
    }

    // Si es una confirmación de conexión del ESP32
    else if (clientType === 'esp32' && data.type === 'esp32_connected') {
      console.log('ESP32 confirmó su conexión');
      broadcastToFrontends({
        type: 'esp32_status',
        connected: true,
        timestamp: Date.now()
      });
    }

    // Ping/pong para mantener conexión viva (Cloudflare timeout)
    else if (data.type === 'ping') {
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now()
      }));
    }

  } catch (error) {
    console.error('Error al procesar mensaje:', error.message);
  }
}

/**
 * Maneja la desconexión de un cliente
 */
function handleDisconnection(ws, clientType) {
  if (clientType === 'esp32' && ws === esp32Client) {
    console.log('ESP32 desconectado');
    esp32Client = null;

    // Notificar a todos los frontends
    broadcastToFrontends({
      type: 'esp32_status',
      connected: false,
      timestamp: Date.now()
    });
  } else if (clientType === 'frontend') {
    frontendClients.delete(ws);
    console.log(`Frontend desconectado. Total de frontends: ${frontendClients.size}`);
  }
}

/**
 * Envía un mensaje a todos los clientes frontend conectados
 */
function broadcastToFrontends(message) {
  const messageStr = JSON.stringify(message);

  frontendClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

/**
 * Manejo de señales de terminación
 */
process.on('SIGINT', () => {
  console.log('Cerrando servidor...');
  wss.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Cerrando servidor...');
  wss.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});
