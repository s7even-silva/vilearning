# 🚀 Inicio Rápido: Cloudflare Tunnel para Cámara USB

## Resumen de lo que hemos hecho

✅ **Código actualizado:**
- `CameraStreamService` ahora detecta automáticamente el entorno
- En desarrollo: usa `http://localhost:8080`
- En producción: usa `https://camera.vlaboratory.org`

---

## 🎯 Lo que necesitas hacer ahora

### Paso 1: Configurar Cloudflare Tunnel (5-10 minutos)

Sigue la guía visual paso a paso:
📚 **[raspberry-pi-setup/CLOUDFLARE_TUNNEL_SETUP.md](raspberry-pi-setup/CLOUDFLARE_TUNNEL_SETUP.md)**

**Resumen ultra-rápido:**

1. Ve a [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels**
2. Abre tu túnel existente → **Configure**
3. En **Public Hostnames**, clic **Add a public hostname**
4. Configura:
   ```
   Subdomain: camera
   Domain: vlaboratory.org
   Type: HTTP
   URL: localhost:8080
   ```
5. Guarda

---

### Paso 2: Verificar que Funciona

#### 2.1 Verificar mjpeg-streamer en Raspberry Pi

```bash
sudo systemctl status mjpeg-streamer
# Debería estar "active (running)"

# Si no está activo:
sudo systemctl start mjpeg-streamer
```

#### 2.2 Probar el stream vía Cloudflare

Abre en navegador (espera 1-2 min después de configurar):
```
https://camera.vlaboratory.org/?action=stream
```

✅ **Resultado esperado:** Deberías ver el video de tu cámara USB con HTTPS (candado 🔒)

---

### Paso 3: Probar en tu Aplicación

1. Accede a tu aplicación:
   ```
   https://vlaboratory.org/myolab
   ```

2. Haz clic en **Iniciar Laboratorio**

3. **Verifica:**
   - ✅ Panel izquierdo: Detección de tu mano (webcam del usuario)
   - ✅ Panel derecho: Stream de la cámara USB con badge "🔴 EN VIVO"
   - ✅ Sin errores de Mixed Content en consola

4. **Consola del navegador (F12) debería mostrar:**
   ```
   [CameraStreamService] Modo producción con Cloudflare Tunnel
   [CameraStreamService] Stream URL configurada: https://camera.vlaboratory.org/?action=stream
   USB camera stream loaded
   ```

---

## 🎉 Si todo funciona

¡Listo! Tu sistema está completamente funcional:

```
Usuario → https://vlaboratory.org/myolab
          ├→ Webcam del usuario (detección de mano)
          └→ https://camera.vlaboratory.org (stream USB)
             └→ Cloudflare Tunnel
                └→ Raspberry Pi (mjpeg-streamer)
                   └→ Cámara USB
```

---

## 🆘 Si algo no funciona

### Error de Mixed Content persiste

**Solución:** Limpia caché del navegador (Ctrl + Shift + R)

### Error 502 Bad Gateway

**Verificar:**
```bash
# 1. mjpeg-streamer corriendo?
sudo systemctl status mjpeg-streamer

# 2. Cloudflared corriendo?
sudo systemctl status cloudflared

# 3. Puerto 8080 escuchando?
sudo netstat -tulpn | grep 8080
```

### Stream no carga en la aplicación

**Verificar en consola del navegador:**
- ¿Qué URL está intentando cargar?
- ¿Hay errores de CORS?
- ¿Hay errores de SSL?

**Ver guía completa de troubleshooting:**
📚 [raspberry-pi-setup/CLOUDFLARE_TUNNEL_SETUP.md#solución-de-problemas](raspberry-pi-setup/CLOUDFLARE_TUNNEL_SETUP.md)

---

## 📊 Arquitectura Final

```
┌─────────────────────────────────────────┐
│           INTERNET (HTTPS)              │
│                                         │
│  Usuario accede a:                      │
│  • vlaboratory.org/myolab               │
│  • camera.vlaboratory.org (automático)  │
└──────────────┬──────────────────────────┘
               │
               │ HTTPS (Cloudflare Proxy)
               │
┌──────────────▼──────────────────────────┐
│        CLOUDFLARE                        │
│                                          │
│  Túnel cifrado a Raspberry Pi            │
└──────────────┬──────────────────────────┘
               │
               │ Encrypted Tunnel
               │
┌──────────────▼──────────────────────────┐
│      RASPBERRY PI (Red Local)            │
│                                          │
│  • cloudflared (túnel)                   │
│  • mjpeg-streamer :8080                  │
│  • Cámara USB /dev/video0                │
└──────────────────────────────────────────┘
```

---

## 📝 Checklist Final

- [ ] Cloudflare Tunnel configurado con hostname `camera.vlaboratory.org`
- [ ] mjpeg-streamer corriendo en Raspberry Pi
- [ ] `https://camera.vlaboratory.org/?action=stream` muestra video
- [ ] Aplicación en `https://vlaboratory.org/myolab` carga sin errores
- [ ] Stream de cámara se ve en panel derecho con badge "EN VIVO"
- [ ] No hay errores de Mixed Content en consola

---

## 🔗 Enlaces Útiles

- **Guía Completa Cloudflare:** [raspberry-pi-setup/CLOUDFLARE_TUNNEL_SETUP.md](raspberry-pi-setup/CLOUDFLARE_TUNNEL_SETUP.md)
- **Configuración Local:** [CAMERA_SETUP.md](CAMERA_SETUP.md)
- **Dashboard Cloudflare:** https://one.dash.cloudflare.com/
- **Aplicación:** https://vlaboratory.org/myolab

---

**¿Necesitas ayuda?** Consulta la documentación completa o revisa los logs:
```bash
# Logs de mjpeg-streamer
sudo journalctl -u mjpeg-streamer -f

# Logs de cloudflared
sudo journalctl -u cloudflared -f
```

---

**Creado:** 2025-11-14
**Proyecto:** ViLearning - Streaming de Cámara USB con HTTPS
