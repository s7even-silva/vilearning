# 📹 Configuración de Streaming de Cámara USB

## Guía Rápida de Instalación

Esta guía te ayudará a configurar el streaming de video desde una cámara USB conectada a tu Raspberry Pi hacia la aplicación ViLearning.

**📚 Para configuración completa con Cloudflare Tunnel (acceso desde Internet), ver:** [CLOUDFLARE_TUNNEL_SETUP.md](raspberry-pi-setup/CLOUDFLARE_TUNNEL_SETUP.md)

---

## 🚀 Instalación Rápida (Red Local)

### 1. Instalar mjpeg-streamer

```bash
cd /home/emg2/Documents/vilearning/raspberry-pi-setup
sudo ./install-camera-streaming.sh
```

**⚠️ Importante:** Después de la instalación, cierra sesión y vuelve a entrar para aplicar los permisos.

### 2. Configurar auto-inicio (Recomendado)

```bash
cd /home/emg2/Documents/vilearning/raspberry-pi-setup
sudo ./setup-systemd-service.sh
```

### 3. Verificar que funciona

Abre en un navegador:
```
http://[IP-de-tu-raspberry]:8080/?action=stream
```

---

## 🎮 Uso Manual (Opcional)

Si prefieres iniciar/detener manualmente el streaming:

**Iniciar:**
```bash
cd /home/emg2/Documents/vilearning/raspberry-pi-setup
./start-camera-stream.sh
```

**Detener:**
```bash
pkill mjpg_streamer
```

---

## 🔧 Comandos Útiles

```bash
# Ver estado del servicio
sudo systemctl status mjpeg-streamer

# Reiniciar servicio
sudo systemctl restart mjpeg-streamer

# Ver logs en tiempo real
sudo journalctl -u mjpeg-streamer -f

# Verificar dispositivos de video
ls -l /dev/video*
```

---

## 🌐 Acceso desde la Aplicación Angular

### Red Local (Desarrollo)

Una vez que el streaming esté activo:

1. Inicia la aplicación Angular:
   ```bash
   npm run dev
   ```

2. Ve al laboratorio MyoLab en: `http://localhost:4200/myolab`

3. El stream de la cámara USB aparecerá automáticamente en el panel "Visualización de la Mano"

### Internet (Producción con HTTPS)

Si necesitas acceso desde Internet con HTTPS:

1. **Configura Cloudflare Tunnel** siguiendo esta guía:
   📚 [CLOUDFLARE_TUNNEL_SETUP.md](raspberry-pi-setup/CLOUDFLARE_TUNNEL_SETUP.md)

2. Una vez configurado:
   - **Aplicación:** `https://vlaboratory.org/myolab`
   - **Stream de cámara:** `https://camera.vlaboratory.org/?action=stream` (automático)

3. El servicio `CameraStreamService` detecta automáticamente el entorno:
   - **Localhost:** Usa `http://localhost:8080`
   - **Producción:** Usa `https://camera.vlaboratory.org`

---

## 🔐 URLs del Sistema

| Entorno | Aplicación | Stream de Cámara | Protocolo |
|---------|-----------|------------------|-----------|
| **Desarrollo** | `http://localhost:4200` | `http://localhost:8080/?action=stream` | HTTP |
| **Producción** | `https://vlaboratory.org` | `https://camera.vlaboratory.org/?action=stream` | HTTPS |

---

## 🆘 Solución de Problemas Comunes

### Problema: No se encuentra /dev/video0

```bash
# Verificar qué dispositivos existen
ls -l /dev/video*

# Si la cámara está en /dev/video1, editar el servicio:
sudo nano /etc/systemd/system/mjpeg-streamer.service
# Cambiar -d /dev/video0 por -d /dev/video1
sudo systemctl daemon-reload
sudo systemctl restart mjpeg-streamer
```

### Problema: Permiso denegado

```bash
sudo usermod -a -G video $USER
# Luego cierra sesión y vuelve a entrar
```

### Problema: Stream lento o con lag

Editar configuración para reducir framerate:
```bash
nano /home/emg2/Documents/vilearning/raspberry-pi-setup/start-camera-stream.sh
# Cambiar FRAMERATE="30" a FRAMERATE="15"
```

---

## 📚 Documentación Completa

Para documentación detallada, ver:
```
/home/emg2/Documents/vilearning/raspberry-pi-setup/README.md
```

---

## 🏗️ Arquitectura

```
Cámara USB → mjpeg-streamer (puerto 8080) → Navegador (Angular App)
```

- **Puerto del stream:** 8080
- **URL del stream:** `http://[IP]:8080/?action=stream`
- **Protocolo:** MJPEG over HTTP
- **Latencia esperada:** 200-400ms

---

## ✅ Checklist de Instalación

- [ ] Script de instalación ejecutado
- [ ] Sesión cerrada y reabierta (para permisos)
- [ ] Servicio systemd configurado
- [ ] Stream accesible en navegador
- [ ] Aplicación Angular detecta el stream
- [ ] Video visible en el laboratorio

---

## 📞 ¿Necesitas Ayuda?

1. Revisa los logs: `sudo journalctl -u mjpeg-streamer -f`
2. Consulta la documentación completa en `raspberry-pi-setup/README.md`
3. Verifica que la cámara esté conectada: `lsusb`

---

**Creado:** 2025-11-14
**Proyecto:** ViLearning - Laboratorio de Prótesis Mioeléctrica
