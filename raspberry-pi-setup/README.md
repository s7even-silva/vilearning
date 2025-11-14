# Configuración de Streaming de Cámara USB para ViLearning

Este directorio contiene todos los scripts necesarios para configurar el streaming de video desde una cámara USB conectada a la Raspberry Pi hacia la aplicación web de ViLearning.

## 📋 Tabla de Contenidos

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Solución de Problemas](#solución-de-problemas)
- [Arquitectura Técnica](#arquitectura-técnica)

---

## 🔧 Requisitos

### Hardware
- Raspberry Pi (modelo 3B+ o superior recomendado)
- Cámara USB compatible con UVC (USB Video Class)
- Conexión de red (WiFi o Ethernet)

### Software
- Raspbian/Raspberry Pi OS (Bullseye o superior)
- Node.js 16+ (para el servidor Angular/WebSocket)
- Git (para clonar repositorios)

### Verificar cámara USB
```bash
# Listar dispositivos USB
lsusb

# Verificar dispositivos de video
ls -l /dev/video*

# Ver detalles de la cámara
v4l2-ctl --list-devices
v4l2-ctl --device=/dev/video0 --list-formats-ext
```

---

## 📦 Instalación

### Paso 1: Instalar mjpeg-streamer

Ejecuta el script de instalación como root:

```bash
cd /home/emg2/Documents/vilearning/raspberry-pi-setup
sudo ./install-camera-streaming.sh
```

Este script:
1. Actualiza los repositorios del sistema
2. Instala dependencias necesarias (build-essential, cmake, libjpeg-dev, etc.)
3. Clona el repositorio de mjpeg-streamer
4. Compila e instala mjpeg-streamer
5. Verifica los dispositivos de video disponibles
6. Agrega el usuario actual al grupo `video`

**⚠️ IMPORTANTE:** Después de la instalación, debes **cerrar sesión y volver a entrar** para que los permisos del grupo `video` se apliquen.

### Paso 2: Verificar la instalación

```bash
# Verificar que mjpg_streamer esté instalado
which mjpg_streamer

# Debería mostrar: /usr/local/bin/mjpg_streamer
```

---

## ⚙️ Configuración

### Opción A: Ejecución Manual

Para probar el streaming manualmente:

```bash
cd /home/emg2/Documents/vilearning/raspberry-pi-setup
./start-camera-stream.sh
```

El stream estará disponible en:
- **Localmente:** http://localhost:8080/?action=stream
- **En red local:** http://[IP-de-tu-raspberry]:8080/?action=stream

Para detener el stream:
```bash
pkill mjpg_streamer
```

### Opción B: Auto-inicio con systemd (Recomendado)

Para que el streaming se inicie automáticamente al arrancar la Raspberry Pi:

```bash
cd /home/emg2/Documents/vilearning/raspberry-pi-setup
sudo ./setup-systemd-service.sh
```

Este script:
1. Copia el archivo de servicio a `/etc/systemd/system/`
2. Habilita el servicio para inicio automático
3. Inicia el servicio inmediatamente

#### Comandos útiles del servicio

```bash
# Ver estado del servicio
sudo systemctl status mjpeg-streamer

# Iniciar el servicio
sudo systemctl start mjpeg-streamer

# Detener el servicio
sudo systemctl stop mjpeg-streamer

# Reiniciar el servicio
sudo systemctl restart mjpeg-streamer

# Ver logs en tiempo real
sudo journalctl -u mjpeg-streamer -f

# Ver últimos 50 logs
sudo journalctl -u mjpeg-streamer -n 50
```

---

## 🚀 Uso

### Desde la Aplicación Angular

Una vez que el streaming esté activo en la Raspberry Pi, la aplicación Angular automáticamente:

1. Detectará el hostname de la Raspberry Pi
2. Conectará al stream en el puerto 8080
3. Mostrará el video en el panel "Visualización de la Mano" del laboratorio
4. Indicará el estado del stream (cargando, activo, error)

### Configuración de URLs

El servicio `CameraStreamService` configura automáticamente la URL:

- **Desarrollo local:** `http://localhost:8080/?action=stream`
- **Producción:** `http://[hostname-de-la-raspberry]:8080/?action=stream`

### Acceso Directo al Stream

También puedes acceder directamente al stream desde un navegador:

**Stream MJPEG:**
```
http://[IP-de-tu-raspberry]:8080/?action=stream
```

**Interfaz web de mjpeg-streamer:**
```
http://[IP-de-tu-raspberry]:8080/
```

---

## 🔍 Solución de Problemas

### Problema: No se encuentra el dispositivo /dev/video0

**Solución:**
```bash
# Verificar dispositivos conectados
lsusb
ls -l /dev/video*

# Si la cámara está en /dev/video1, editar:
sudo nano /etc/systemd/system/mjpeg-streamer.service

# Cambiar -d /dev/video0 por -d /dev/video1
# Reiniciar servicio:
sudo systemctl daemon-reload
sudo systemctl restart mjpeg-streamer
```

### Problema: Permiso denegado al acceder a la cámara

**Solución:**
```bash
# Verificar que estés en el grupo video
groups

# Si no aparece 'video', agregar usuario:
sudo usermod -a -G video $USER

# Cerrar sesión y volver a entrar
```

### Problema: El stream es muy lento o tiene lag

**Solución 1: Reducir framerate**
```bash
# Editar el script o servicio
sudo nano /home/emg2/Documents/vilearning/raspberry-pi-setup/start-camera-stream.sh

# Cambiar FRAMERATE de 30 a 15:
FRAMERATE="15"

# Reiniciar
```

**Solución 2: Reducir resolución**
```bash
# Cambiar RESOLUTION de 640x480 a 320x240:
RESOLUTION="320x240"
```

**Solución 3: Ajustar calidad JPEG**
```bash
# Reducir QUALITY de 80 a 60:
QUALITY="60"
```

### Problema: El stream no se ve en la aplicación Angular

**Diagnóstico:**
```bash
# 1. Verificar que el servicio esté corriendo
sudo systemctl status mjpeg-streamer

# 2. Verificar que el puerto esté abierto
sudo netstat -tulpn | grep 8080

# 3. Probar acceso local
curl -I http://localhost:8080/?action=stream

# 4. Verificar firewall (si está habilitado)
sudo ufw status
sudo ufw allow 8080/tcp
```

### Problema: Error "Address already in use"

**Solución:**
```bash
# Encontrar proceso usando el puerto 8080
sudo lsof -i :8080

# Matar proceso
sudo kill -9 [PID]

# Reiniciar servicio
sudo systemctl restart mjpeg-streamer
```

### Ver logs detallados

```bash
# Logs del servicio systemd
sudo journalctl -u mjpeg-streamer -f

# Logs del sistema
dmesg | grep video
dmesg | grep uvcvideo
```

---

## 🏗️ Arquitectura Técnica

### Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     RASPBERRY PI                             │
│                                                              │
│  ┌─────────────┐                                            │
│  │  Cámara USB │                                            │
│  │ /dev/video0 │                                            │
│  └──────┬──────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────┐                   │
│  │      mjpeg-streamer                 │                   │
│  │  - Captura frames (V4L2)            │                   │
│  │  - Codifica a JPEG                  │                   │
│  │  - Sirve por HTTP (puerto 8080)     │                   │
│  └─────────────┬───────────────────────┘                   │
│                │                                             │
└────────────────┼─────────────────────────────────────────────┘
                 │
                 │ HTTP (MJPEG stream)
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              NAVEGADOR DEL USUARIO                           │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │         Angular Application                   │          │
│  │                                                │          │
│  │  ┌─────────────────────────────────────┐     │          │
│  │  │  CameraStreamService                 │     │          │
│  │  │  - Gestiona URL del stream           │     │          │
│  │  │  - Maneja estados (load/error)       │     │          │
│  │  └──────────────┬──────────────────────┘     │          │
│  │                 │                             │          │
│  │                 ▼                             │          │
│  │  ┌─────────────────────────────────────┐     │          │
│  │  │  LabWorkspace Component              │     │          │
│  │  │  - Muestra stream en <img>           │     │          │
│  │  │  - Muestra estados (loading/error)   │     │          │
│  │  │  - Botón de retry                    │     │          │
│  │  └─────────────────────────────────────┘     │          │
│  │                                                │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Captura:** La cámara USB captura video
2. **Codificación:** mjpeg-streamer convierte cada frame a JPEG
3. **Streaming:** Los JPEGs se envían por HTTP usando multipart/x-mixed-replace
4. **Recepción:** El navegador recibe el stream y lo muestra en un elemento `<img>`
5. **Visualización:** El usuario ve el video en tiempo real de la prótesis

### Especificaciones del Stream

- **Protocolo:** MJPEG over HTTP
- **Puerto:** 8080
- **Resolución por defecto:** 640x480
- **Framerate por defecto:** 30 fps
- **Calidad JPEG:** 80/100
- **Latencia esperada:** 200-400ms
- **Ancho de banda:** ~2-5 Mbps (depende de calidad y resolución)

---

## 📝 Archivos del Proyecto

```
raspberry-pi-setup/
├── README.md                          # Este archivo
├── install-camera-streaming.sh        # Script de instalación
├── start-camera-stream.sh             # Script para iniciar manualmente
├── setup-systemd-service.sh           # Configurar auto-inicio
└── mjpeg-streamer.service            # Archivo de servicio systemd
```

### Frontend Angular

```
src/app/components/myolab/
├── camera-stream.service.ts           # Servicio de streaming
├── lab-workspace/
│   ├── lab-workspace.ts               # Componente con lógica
│   ├── lab-workspace.html             # Template con <img> del stream
│   └── lab-workspace.scss             # Estilos del stream
```

---

## 🔐 Consideraciones de Seguridad

### Red Local
- El stream está disponible sin autenticación
- Recomendado solo para uso en red local confiable
- No exponer directamente a Internet

### Producción
Si necesitas acceso desde Internet:

1. **Usar HTTPS:** Configura un proxy inverso con SSL (nginx, Apache)
2. **Autenticación:** Agrega autenticación básica o token-based
3. **VPN:** Accede a través de VPN
4. **Cloudflare Tunnel:** Similar al WebSocket del ESP32

Ejemplo con nginx:
```nginx
server {
    listen 443 ssl;
    server_name camera.tudominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }
}
```

---

## 🎯 Rendimiento y Optimización

### Rendimiento Esperado

| Hardware | Resolución | FPS | CPU Usage | Calidad |
|----------|-----------|-----|-----------|---------|
| RPi 3B+ | 640x480 | 30 | 8-12% | Buena |
| RPi 3B+ | 640x480 | 15 | 5-8% | Buena |
| RPi 4 | 640x480 | 30 | 5-8% | Excelente |
| RPi 4 | 1280x720 | 30 | 12-18% | Excelente |

### Recomendaciones de Optimización

1. **Para mejor latencia:** Reducir framerate a 15-20 fps
2. **Para menor bandwidth:** Reducir calidad JPEG a 60-70
3. **Para mejor calidad:** Aumentar a 1280x720 (solo RPi 4)
4. **Para múltiples viewers:** Considerar migrar a JSMpeg + WebSocket

---

## 🚀 Próximos Pasos (Opcional)

### Migración a JSMpeg para menor latencia

Si necesitas latencia < 150ms, considera migrar a JSMpeg:

**Ventajas:**
- Latencia 50-150ms (vs 200-400ms de MJPEG)
- Mejor uso de ancho de banda
- Integración con WebSocket existente

**Desventajas:**
- Más complejo de configurar
- Requiere FFmpeg
- Requiere biblioteca JavaScript adicional

Ver documentación completa en la respuesta inicial del agente.

---

## 📞 Soporte

Para problemas o preguntas:

1. Revisar logs: `sudo journalctl -u mjpeg-streamer -f`
2. Verificar documentación de mjpeg-streamer: https://github.com/jacksonliam/mjpg-streamer
3. Consultar issues del proyecto en GitHub

---

## 📄 Licencia

Este proyecto utiliza mjpeg-streamer que está bajo licencia GPL v2.

---

**Última actualización:** 2025-11-14
