# ViLearning WebSocket Server

Servidor WebSocket que actúa como intermediario (relay) entre el frontend Angular y el ESP32 para controlar servomotores en tiempo real.

## 🏗️ Arquitectura

```
[Frontend Angular] ←WebSocket→ [Servidor RPi] ←WebSocket→ [ESP32] → [Servomotores]
```

El servidor mantiene conexiones con:
- **Múltiples clientes frontend** (navegadores web)
- **Un cliente ESP32** (hardware)

## 📋 Requisitos

- **Node.js** >= 14.0.0
- **npm** >= 6.0.0
- **Raspberry Pi** con conectividad de red
- **ESP32** con WiFi

## 🚀 Instalación

### 1. Instalar Node.js en Raspberry Pi

```bash
# Actualizar repositorios
sudo apt update

# Instalar Node.js y npm
sudo apt install -y nodejs npm

# Verificar instalación
node --version
npm --version
```

### 2. Instalar dependencias del servidor

```bash
cd server
npm install
```

## ⚙️ Configuración

### Variables de entorno (opcional)

Crear archivo `.env` en la carpeta `server/`:

```env
WS_PORT=3001
WS_HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info
```

### Firewall (importante)

Abrir puerto 3001 en la Raspberry Pi:

```bash
sudo ufw allow 3001/tcp
sudo ufw reload
```

## ▶️ Ejecución

### Desarrollo

```bash
npm start
```

### Producción (con PM2)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar servidor con PM2
pm2 start server.js --name vilearning-server

# Configurar inicio automático
pm2 startup
pm2 save

# Ver logs
pm2 logs vilearning-server

# Detener servidor
pm2 stop vilearning-server

# Reiniciar servidor
pm2 restart vilearning-server
```

## 📡 Protocolo de Comunicación

### Conexión

Los clientes deben especificar su tipo al conectarse mediante query parameter:

- **Frontend**: `ws://raspberry-ip:3001?client=frontend`
- **ESP32**: `ws://raspberry-ip:3001?client=esp32`

### Formato de Mensajes

Todos los mensajes son JSON:

#### Frontend → Servidor (comando de motores)

```json
{
  "type": "motor_command",
  "data": "1,0;2,150;3,0;4,150;5,150",
  "timestamp": 1736789123456
}
```

Formato del comando: `"servoNum,angle;servoNum,angle;..."` donde:
- `servoNum`: 1-5 (pulgar, índice, medio, anular, meñique)
- `angle`: 0-180 (0 = extendido, 150 = contraído)

#### Servidor → ESP32 (reenvío de comando)

```json
{
  "type": "motor_command",
  "data": "1,0;2,150;3,0;4,150;5,150",
  "timestamp": 1736789123456
}
```

#### ESP32 → Servidor (confirmación de conexión)

```json
{
  "type": "esp32_connected",
  "timestamp": 1736789123456
}
```

#### ESP32 → Servidor (estado de motores - opcional)

```json
{
  "type": "motor_status",
  "data": {
    "servo1": 0,
    "servo2": 150,
    "servo3": 0,
    "servo4": 150,
    "servo5": 150
  },
  "timestamp": 1736789123456
}
```

#### Servidor → Frontend (estado del ESP32)

```json
{
  "type": "esp32_status",
  "connected": true,
  "timestamp": 1736789123456
}
```

#### Ping/Pong (mantener conexión viva)

```json
// Cliente → Servidor
{
  "type": "ping",
  "timestamp": 1736789123456
}

// Servidor → Cliente
{
  "type": "pong",
  "timestamp": 1736789123456
}
```

## 🔌 Configuración del ESP32

Ver el archivo `ESP32_CLIENT_EXAMPLE.ino` para un ejemplo completo de código.

### Librerías necesarias

En Arduino IDE o PlatformIO:

```cpp
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ESP32Servo.h>
```

**Instalar desde Library Manager:**
- WebSocketsClient by Links2004 (v2.4.1+)
- ESP32Servo by Kevin Harrington

### Configuración básica

```cpp
// WiFi
const char* ssid = "TU_RED_WIFI";
const char* password = "TU_PASSWORD";

// WebSocket
const char* wsHost = "192.168.1.X";  // IP de la Raspberry Pi
const uint16_t wsPort = 3001;
const char* wsPath = "/?client=esp32";

// Pines GPIO para servos (ajustar según tu cableado)
const int servoPins[5] = {18, 19, 21, 22, 23};
```

## 🌐 Configuración de Red

### Desarrollo Local (misma red WiFi)

1. Obtener IP de la Raspberry Pi:
   ```bash
   hostname -I
   ```

2. Frontend Angular conecta a: `ws://192.168.1.X:3001?client=frontend`

3. ESP32 conecta a: `ws://192.168.1.X:3001?client=esp32`

### Producción (Internet con Cloudflare Tunnel)

#### Opción 1: Subdomain dedicado

Configurar Cloudflare Tunnel (`config.yml`):

```yaml
ingress:
  - hostname: tu-dominio.com
    service: http://localhost:4200  # Angular
  - hostname: ws.tu-dominio.com
    service: ws://localhost:3001    # WebSocket
  - service: http_status:404
```

Frontend conecta a: `wss://ws.tu-dominio.com?client=frontend`

#### Opción 2: Path en mismo dominio

```yaml
ingress:
  - hostname: tu-dominio.com
    path: /ws
    service: ws://localhost:3001
  - hostname: tu-dominio.com
    service: http://localhost:4200
  - service: http_status:404
```

Frontend conecta a: `wss://tu-dominio.com/ws?client=frontend`

**Nota**: ESP32 debe conectarse siempre a la IP local de la RPi, no al túnel de Cloudflare.

## 🐛 Troubleshooting

### El servidor no inicia

```bash
# Verificar que el puerto 3001 no esté en uso
sudo lsof -i :3001

# Si está en uso, matar el proceso
sudo kill -9 <PID>
```

### Frontend no puede conectarse

1. Verificar firewall:
   ```bash
   sudo ufw status
   ```

2. Verificar que el servidor esté escuchando:
   ```bash
   netstat -tuln | grep 3001
   ```

3. Verificar logs del servidor:
   ```bash
   pm2 logs vilearning-server
   ```

### ESP32 no se conecta

1. Verificar que ESP32 esté en la misma red WiFi
2. Hacer ping desde RPi al ESP32:
   ```bash
   ping <IP_DEL_ESP32>
   ```
3. Verificar Serial Monitor del ESP32 para ver mensajes de error
4. Verificar que la IP de la RPi sea correcta en el código del ESP32

### Cloudflare desconecta WebSocket

Cloudflare cierra conexiones inactivas después de 100 segundos. Solución:

**En el frontend:**
```typescript
// Enviar ping cada 60 segundos
setInterval(() => {
  this.socket.send(JSON.stringify({
    type: 'ping',
    timestamp: Date.now()
  }));
}, 60000);
```

## 📊 Logs y Monitoreo

### Ver logs en tiempo real

```bash
# Con npm start (desarrollo)
# Los logs aparecen directamente en la terminal

# Con PM2 (producción)
pm2 logs vilearning-server

# Solo errores
pm2 logs vilearning-server --err

# Últimas 100 líneas
pm2 logs vilearning-server --lines 100
```

### Mensajes de log importantes

- `Servidor WebSocket escuchando en 0.0.0.0:3001` - Servidor iniciado
- `ESP32 conectado exitosamente` - ESP32 se conectó
- `Frontend conectado. Total de frontends: X` - Cliente web conectado
- `Comando reenviado al ESP32: ...` - Comando enviado al hardware
- `ESP32 no conectado. Comando no enviado.` - Hardware no disponible

## 🔒 Seguridad

⚠️ **Advertencia**: Este servidor NO tiene autenticación implementada.

Para producción, se recomienda agregar:
- Autenticación JWT
- Rate limiting
- Validación de origen (CORS)
- Encriptación SSL/TLS (usar `wss://` en lugar de `ws://`)

## 📝 Notas Adicionales

- El servidor solo permite **1 ESP32 conectado** a la vez
- Si se conecta un nuevo ESP32, el anterior se desconecta
- El servidor soporta **múltiples frontends** simultáneos
- Todos los mensajes se validan como JSON antes de procesar
- Los comandos de motor se reenvían sin modificación al ESP32

## 🤝 Contribuir

Para reportar bugs o sugerir mejoras, crear un issue en el repositorio del proyecto.

## 📄 Licencia

ISC
