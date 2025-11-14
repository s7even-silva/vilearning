# 🌐 Guía de Configuración: Cloudflare Tunnel para Stream de Cámara

Esta guía te llevará paso a paso para configurar un Cloudflare Tunnel usando el **Dashboard Web** (sin código) para exponer el stream de tu cámara USB a través de HTTPS.

---

## 🎯 Objetivo

Exponer el stream de la cámara USB (que corre en `http://localhost:8080`) a través de HTTPS en el subdominio `camera.vlaboratory.org`, resolviendo el error de **Mixed Content** en navegadores.

---

## ⚡ Resumen Rápido

```
ANTES:
📱 Navegador → https://vlaboratory.org/myolab ✅ HTTPS
              → http://vlaboratory.org:8080  ❌ HTTP (BLOQUEADO)

DESPUÉS:
📱 Navegador → https://vlaboratory.org/myolab       ✅ HTTPS
              → https://camera.vlaboratory.org      ✅ HTTPS
                → Cloudflare Tunnel
                  → Raspberry Pi localhost:8080
```

---

## 📋 Requisitos Previos

- ✅ Cuenta de Cloudflare con tu dominio `vlaboratory.org` configurado
- ✅ Acceso al Dashboard de Cloudflare Zero Trust
- ✅ mjpeg-streamer corriendo en la Raspberry Pi (puerto 8080)
- ✅ (Opcional) Cloudflared ya instalado si tienes túneles existentes

---

## 🚀 Paso a Paso

### **Paso 1: Acceder a Cloudflare Zero Trust**

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Selecciona tu cuenta
3. En el menú lateral izquierdo, haz clic en **Zero Trust**
4. Ve a **Networks** → **Tunnels**

![Cloudflare Dashboard - Tunnels](https://i.imgur.com/example1.png)

---

### **Paso 2: Seleccionar o Crear Túnel**

#### Opción A: Usar Túnel Existente (Recomendado) ⭐

Si ya tienes un túnel configurado (el que usas para `vlaboratory.org` o `ws.vlaboratory.org`):

1. En la lista de túneles, identifica tu túnel existente
2. Haz clic en el nombre del túnel o en **Configure** (icono de engranaje ⚙️)
3. **Continúa al Paso 3**

#### Opción B: Crear Nuevo Túnel

Si no tienes túneles o quieres uno dedicado para la cámara:

1. Haz clic en **Create a tunnel**
2. Selecciona **Cloudflared** como tipo de conector
3. Dale un nombre descriptivo:
   ```
   Nombre sugerido: camera-stream-tunnel
   ```
4. Haz clic en **Save tunnel**

5. **Instalar Cloudflared en Raspberry Pi** (si no lo tienes):

   ```bash
   # Descargar e instalar cloudflared
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
   sudo mv cloudflared-linux-arm64 /usr/local/bin/cloudflared
   sudo chmod +x /usr/local/bin/cloudflared

   # Autenticar
   cloudflared tunnel login
   ```

6. **Conectar el túnel** (Cloudflare te mostrará un comando similar a este):

   ```bash
   sudo cloudflared service install <TOKEN_AQUÍ>
   ```

7. El túnel debería aparecer como **HEALTHY** (verde) en el dashboard

---

### **Paso 3: Agregar Public Hostname para la Cámara**

1. En la configuración del túnel, ve a la pestaña **Public Hostnames**

2. Haz clic en **Add a public hostname**

3. Llena el formulario como se muestra:

```
┌─────────────────────────────────────────────────────────┐
│ Add a public hostname                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Public hostname                                          │
│ ┌──────────────┬─────────────────────────────────────┐ │
│ │ Subdomain    │ Domain                              │ │
│ ├──────────────┼─────────────────────────────────────┤ │
│ │ camera       │ vlaboratory.org              [▼]   │ │
│ └──────────────┴─────────────────────────────────────┘ │
│                                                          │
│ Path (opcional)                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [dejar vacío]                                      │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ──────────────────────────────────────────────────────  │
│                                                          │
│ Service                                                  │
│                                                          │
│ Type:                                                    │
│   ⚪ Public hostname                                     │
│   🔘 HTTP          ← SELECCIONAR ESTA                   │
│   ⚪ HTTPS                                               │
│   ⚪ TCP                                                 │
│   ⚪ SSH                                                 │
│   ⚪ RDP                                                 │
│                                                          │
│ URL:                                                     │
│ ┌────────────────────────────────────────────────────┐ │
│ │ localhost:8080                                     │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ──────────────────────────────────────────────────────  │
│                                                          │
│ ▼ Additional application settings (expandir si necesario)│
│                                                          │
│   HTTP Settings                                          │
│   ┌──────────────────────────────────────────────────┐ │
│   │ ☐ Disable chunked transfer encoding             │ │
│   │ ☐ HTTP Host Header: [vacío]                     │ │
│   │ ☐ Origin Server Name: [vacío]                   │ │
│   └──────────────────────────────────────────────────┘ │
│                                                          │
│   TLS Settings                                           │
│   ┌──────────────────────────────────────────────────┐ │
│   │ ☐ No TLS Verify (dejar desmarcado)              │ │
│   └──────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘

             [Cancel]  [Save hostname]
```

**Valores importantes:**
- **Subdomain:** `camera`
- **Domain:** `vlaboratory.org`
- **Type:** `HTTP` (no HTTPS, porque mjpeg-streamer usa HTTP localmente)
- **URL:** `localhost:8080`

4. Haz clic en **Save hostname**

---

### **Paso 4: Verificar Configuración DNS (Automático)**

Cloudflare **crea automáticamente** el registro DNS. Para verificar:

1. Ve a **Cloudflare Dashboard** (salir de Zero Trust)
2. Selecciona tu dominio `vlaboratory.org`
3. Ve a **DNS** → **Records**
4. Deberías ver un nuevo registro:

```
Type:   CNAME
Name:   camera
Content: <tu-tunnel-id>.cfargotunnel.com
Proxy:  🟠 Proxied (naranja) ← IMPORTANTE
TTL:    Auto
```

**⚠️ IMPORTANTE:** Asegúrate de que el icono esté **naranja (Proxied)**, NO gris. Esto habilita HTTPS y protección de Cloudflare.

---

### **Paso 5: Verificar que el Stream Funciona**

#### 5.1 Verificar mjpeg-streamer en Raspberry Pi

```bash
# Ver estado del servicio
sudo systemctl status mjpeg-streamer

# Si está inactivo, iniciarlo
sudo systemctl start mjpeg-streamer

# Ver logs en tiempo real
sudo journalctl -u mjpeg-streamer -f
```

**Salida esperada:**
```
● mjpeg-streamer.service - MJPEG Streamer for USB Camera
   Loaded: loaded
   Active: active (running)
```

#### 5.2 Probar Stream Localmente

Desde la Raspberry Pi:
```bash
curl -I http://localhost:8080/?action=stream
```

**Salida esperada:**
```
HTTP/1.1 200 OK
Content-Type: multipart/x-mixed-replace; boundary=--myboundary
```

#### 5.3 Probar Stream a través de Cloudflare Tunnel

**⏱️ Espera 1-2 minutos** para que la configuración se propague.

Luego, abre en un navegador:
```
https://camera.vlaboratory.org/?action=stream
```

**Resultado esperado:**
- ✅ Deberías ver el video en vivo de tu cámara USB
- ✅ El icono de candado 🔒 (HTTPS) debería estar presente en la barra de direcciones
- ✅ No hay advertencias de seguridad

**Si ves error 502 Bad Gateway:**
- Verifica que mjpeg-streamer esté corriendo
- Verifica que el túnel esté conectado (status HEALTHY en dashboard)
- Espera 1-2 minutos más

---

### **Paso 6: Probar en la Aplicación ViLearning**

1. Asegúrate de que el código Angular esté actualizado (CameraStreamService modificado)

2. Compila la aplicación (si es necesario):
   ```bash
   cd /home/emg2/Documents/vilearning
   npm run build
   ```

3. Accede a tu aplicación desde Internet:
   ```
   https://vlaboratory.org/myolab
   ```

4. Haz clic en **Iniciar Laboratorio**

5. Acepta los permisos de la cámara web (para detección de manos)

6. **Verifica el panel derecho:**
   - ✅ NO debería mostrar error de Mixed Content
   - ✅ Debería mostrar primero "Cargando stream de la prótesis..."
   - ✅ Luego debería cargar el video con badge "🔴 EN VIVO"

7. **Abre la consola del navegador (F12):**
   ```
   Deberías ver:
   [CameraStreamService] Modo producción con Cloudflare Tunnel
   [CameraStreamService] Stream URL configurada: https://camera.vlaboratory.org/?action=stream
   USB camera stream loaded
   ```

---

## ✅ Checklist de Verificación

Usa esta lista para confirmar que todo está configurado correctamente:

### Cloudflare Dashboard
- [ ] Túnel existe y está en estado **HEALTHY** (verde)
- [ ] Public hostname `camera.vlaboratory.org` está configurado
- [ ] Service Type es **HTTP**
- [ ] Service URL es `localhost:8080`
- [ ] Registro DNS CNAME existe para `camera`
- [ ] Proxy status es **Proxied** (naranja 🟠)

### Raspberry Pi
- [ ] mjpeg-streamer está corriendo: `systemctl status mjpeg-streamer`
- [ ] Stream local funciona: `curl http://localhost:8080/?action=stream`
- [ ] Cloudflared está corriendo (si es túnel nuevo): `systemctl status cloudflared`

### Navegador
- [ ] `https://camera.vlaboratory.org/?action=stream` muestra video
- [ ] Conexión es HTTPS (candado 🔒 en barra de direcciones)
- [ ] No hay advertencias de seguridad

### Aplicación ViLearning
- [ ] `https://vlaboratory.org/myolab` carga sin errores
- [ ] No hay errores de Mixed Content en consola
- [ ] Stream de cámara se muestra en panel derecho
- [ ] Badge "🔴 EN VIVO" aparece cuando está activo
- [ ] Detección de manos sigue funcionando (panel izquierdo)

---

## 🐛 Solución de Problemas

### Problema: Error 502 Bad Gateway

**Causa:** El túnel no puede conectarse al servicio local.

**Solución:**
```bash
# 1. Verificar que mjpeg-streamer esté corriendo
sudo systemctl status mjpeg-streamer
sudo systemctl start mjpeg-streamer

# 2. Verificar que cloudflared esté corriendo
sudo systemctl status cloudflared
sudo systemctl restart cloudflared

# 3. Ver logs del túnel
sudo journalctl -u cloudflared -f
```

---

### Problema: Error 521 (Web Server Is Down)

**Causa:** Cloudflare puede conectarse al túnel, pero el túnel no puede conectarse al servicio local.

**Solución:**
```bash
# Verificar que el puerto 8080 esté escuchando
sudo netstat -tulpn | grep 8080

# Debería mostrar:
# tcp  0  0  0.0.0.0:8080  0.0.0.0:*  LISTEN  <pid>/mjpg_streamer
```

---

### Problema: Mixed Content Error persiste

**Causa:** El frontend sigue usando HTTP en lugar de HTTPS.

**Solución:**
1. Verifica que el código de `CameraStreamService` esté actualizado
2. Limpia caché del navegador (Ctrl + Shift + R)
3. Verifica en consola del navegador:
   ```
   [CameraStreamService] Stream URL configurada: https://camera...
   ```
   Debe decir **https://** NO http://

---

### Problema: DNS no resuelve camera.vlaboratory.org

**Causa:** DNS no se ha propagado.

**Solución:**
1. Espera 5-10 minutos
2. Verifica manualmente:
   ```bash
   nslookup camera.vlaboratory.org
   # o
   dig camera.vlaboratory.org
   ```
3. Debería resolver a servidores de Cloudflare (*.cloudflare.com)

---

### Problema: El stream funciona pero es muy lento

**Causa:** Latencia adicional por Cloudflare Tunnel.

**Solución:**
Reduce calidad/framerate del stream:
```bash
# Editar configuración
sudo nano /home/emg2/Documents/vilearning/raspberry-pi-setup/start-camera-stream.sh

# Cambiar:
FRAMERATE="15"  # Reducir de 30 a 15
QUALITY="60"    # Reducir de 80 a 60

# Reiniciar
sudo systemctl restart mjpeg-streamer
```

---

## 📊 Arquitectura Final

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET                              │
└─────────────────────────┬───────────────────────────────┘
                          │
                          │ HTTPS
                          │
┌─────────────────────────▼───────────────────────────────┐
│                 CLOUDFLARE                                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ vlaboratory.org              (App Angular)       │  │
│  │ ws.vlaboratory.org           (WebSocket ESP32)   │  │
│  │ camera.vlaboratory.org       (Stream Cámara) ⭐  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Cloudflare Tunnel (cifrado)                             │
└─────────────────────────┬────────────────────────────────┘
                          │
                          │ Encrypted Tunnel
                          │
┌─────────────────────────▼────────────────────────────────┐
│              RASPBERRY PI (Red Local)                     │
│                                                           │
│  ┌────────────────────┐  ┌─────────────────────────┐    │
│  │ cloudflared        │  │ Servicios Locales       │    │
│  │ (Tunnel Agent)     │  │                         │    │
│  └──────────┬─────────┘  │ :4200 - Angular         │    │
│             │            │ :3001 - WebSocket       │    │
│             └───────────►│ :8080 - mjpeg-streamer  │    │
│                          └───────────┬─────────────┘    │
│                                      │                   │
│                          ┌───────────▼─────────────┐    │
│                          │  Cámara USB             │    │
│                          │  /dev/video0            │    │
│                          └─────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
```

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu stream de cámara estará accesible de forma segura a través de HTTPS desde cualquier parte del mundo.

**URLs finales:**
- Aplicación principal: `https://vlaboratory.org`
- Laboratorio: `https://vlaboratory.org/myolab`
- Stream de cámara: `https://camera.vlaboratory.org/?action=stream`
- WebSocket ESP32: `wss://ws.vlaboratory.org`

---

## 📚 Recursos Adicionales

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Zero Trust Dashboard](https://one.dash.cloudflare.com/)
- [Documentación de mjpeg-streamer](https://github.com/jacksonliam/mjpg-streamer)

---

**Creado:** 2025-11-14
**Proyecto:** ViLearning - Laboratorio de Prótesis Mioeléctrica
**Autor:** Claude Code
