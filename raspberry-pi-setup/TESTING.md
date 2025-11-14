# 🧪 Guía de Pruebas - Streaming de Cámara USB

## Paso a Paso para Probar el Sistema

Esta guía te ayudará a verificar que todo el sistema de streaming funciona correctamente.

---

## 📋 Pre-requisitos

Antes de comenzar las pruebas, asegúrate de tener:

- [x] Cámara USB conectada a la Raspberry Pi
- [x] mjpeg-streamer instalado
- [x] Servicio systemd configurado (opcional pero recomendado)
- [x] Aplicación Angular actualizada con los nuevos cambios

---

## 🔍 Pruebas del Backend (Raspberry Pi)

### Prueba 1: Verificar dispositivo de video

```bash
# Verificar que la cámara esté conectada
lsusb | grep -i camera

# Verificar dispositivos de video
ls -l /dev/video*

# Ver información detallada
v4l2-ctl --list-devices
v4l2-ctl --device=/dev/video0 --all
```

**Resultado esperado:** Deberías ver `/dev/video0` (o video1, video2, etc.)

---

### Prueba 2: Verificar instalación de mjpeg-streamer

```bash
# Verificar que mjpg_streamer esté instalado
which mjpg_streamer

# Verificar librerías
ls /usr/local/lib/mjpg-streamer/
```

**Resultado esperado:**
- Path: `/usr/local/bin/mjpg_streamer`
- Librerías: `input_uvc.so`, `output_http.so`, etc.

---

### Prueba 3: Iniciar streaming manualmente

```bash
cd /home/emg2/Documents/vilearning/raspberry-pi-setup
./start-camera-stream.sh
```

**Resultado esperado:**
```
[✓] Streaming iniciado correctamente

Accede al stream en:
  http://localhost:8080/?action=stream
  http://192.168.x.x:8080/?action=stream

Para detener: pkill mjpg_streamer
```

---

### Prueba 4: Verificar que el stream esté sirviendo

```bash
# Verificar proceso
ps aux | grep mjpg_streamer

# Verificar puerto
sudo netstat -tulpn | grep 8080

# Probar con curl
curl -I http://localhost:8080/?action=stream
```

**Resultado esperado del curl:**
```
HTTP/1.1 200 OK
Content-Type: multipart/x-mixed-replace; boundary=--myboundary
...
```

---

### Prueba 5: Acceder desde navegador local

Abre un navegador en la Raspberry Pi y accede a:
```
http://localhost:8080/
```

**Resultado esperado:**
- Deberías ver la interfaz web de mjpeg-streamer
- Al hacer clic en "Stream" deberías ver el video de la cámara

---

### Prueba 6: Acceder desde otro dispositivo en la red

Desde tu computadora o teléfono en la misma red:

```
http://[IP-de-la-raspberry]:8080/?action=stream
```

**Obtener IP de la Raspberry:**
```bash
hostname -I
# O
ip addr show
```

**Resultado esperado:** Deberías ver el stream de video en tiempo real

---

## 🌐 Pruebas del Frontend (Angular)

### Prueba 7: Verificar archivos del servicio

```bash
# Verificar que el servicio existe
ls -l /home/emg2/Documents/vilearning/src/app/components/myolab/camera-stream.service.ts

# Verificar componente actualizado
ls -l /home/emg2/Documents/vilearning/src/app/components/myolab/lab-workspace/lab-workspace.*
```

---

### Prueba 8: Compilar la aplicación Angular

```bash
cd /home/emg2/Documents/vilearning
npm run build
```

**Resultado esperado:** Compilación exitosa sin errores de TypeScript

---

### Prueba 9: Iniciar la aplicación en modo desarrollo

```bash
cd /home/emg2/Documents/vilearning

# Opción 1: Solo frontend
npm start

# Opción 2: Frontend + Backend WebSocket
npm run dev
```

**Resultado esperado:**
```
Application bundle generation complete.
✔ Browser application bundle generation complete.
Watch mode enabled. Watching for file changes...
Local: http://localhost:4200/
```

---

### Prueba 10: Verificar el laboratorio en el navegador

1. Abre el navegador y ve a: `http://localhost:4200/myolab`
2. Haz clic en "Iniciar Laboratorio"
3. Acepta los permisos de la cámara web (para detección de manos)

**Resultado esperado:**
- Panel izquierdo: Detección de tu mano (con canvas y landmarks)
- Panel derecho:
  - Mientras carga: Spinner con mensaje "Cargando stream de la prótesis..."
  - Una vez cargado: Video en vivo de la cámara USB con badge "🔴 EN VIVO"

---

### Prueba 11: Verificar estados del stream

#### Estado de Carga
- Al entrar al laboratorio, deberías ver un spinner
- Mensaje: "Cargando stream de la prótesis..."

#### Estado Activo
- Video mostrándose correctamente
- Badge "🔴 EN VIVO" en la esquina superior derecha
- Indicador de gesto detectado en la parte inferior

#### Estado de Error (simulado)
Para probar el estado de error, detén el stream:
```bash
pkill mjpg_streamer
```

**Resultado esperado:**
- Icono de advertencia ⚠️
- Mensaje de error
- Botón "🔄 Reintentar"

Al hacer clic en "Reintentar", debería intentar cargar nuevamente.

---

### Prueba 12: Verificar consola del navegador

Abre las DevTools (F12) y verifica la consola:

**Mensajes esperados (sin errores):**
```
USB camera stream loaded
```

**Si hay error:**
```
Failed to load USB camera stream
Stream no disponible: [error details]
```

---

## 🔄 Pruebas de Integración Completa

### Prueba 13: Flujo completo del laboratorio

1. **Iniciar servicios:**
   ```bash
   # En la Raspberry Pi
   sudo systemctl start mjpeg-streamer

   # En terminal de desarrollo
   cd /home/emg2/Documents/vilearning
   npm run dev
   ```

2. **Acceder a la aplicación:**
   - Ir a `http://localhost:4200/`
   - Navegar a "Cursos"
   - Seleccionar "Laboratorio de Prótesis Mioeléctrica"

3. **Iniciar laboratorio:**
   - Hacer clic en "Iniciar Laboratorio"
   - Aceptar permisos de cámara web

4. **Verificar funcionalidad:**
   - ✓ Panel izquierdo detecta tu mano
   - ✓ Panel derecho muestra stream de cámara USB
   - ✓ Estado de dedos se actualiza en tiempo real
   - ✓ Gesto detectado se muestra correctamente
   - ✓ Badge "EN VIVO" visible

5. **Realizar gestos:**
   - Puño cerrado → Verificar que se detecta
   - Mano abierta → Verificar que se detecta
   - Victoria (✌️) → Verificar que se detecta

6. **Finalizar laboratorio:**
   - Hacer clic en "Finalizar Laboratorio"
   - Responder cuestionario
   - Ver resultados

---

### Prueba 14: Prueba de latencia

1. Coloca tu mano frente a la cámara USB
2. Mueve la mano frente a la cámara web (detección)
3. Observa el stream de la cámara USB en la aplicación

**Evaluar:**
- Latencia esperada: 200-400ms
- Si es > 500ms, considera reducir framerate o calidad

**Medir latencia aproximada:**
```bash
# En la Raspberry Pi
ping localhost
# Latencia de red local

# Observar retraso visual
# Hacer un gesto rápido y contar mentalmente el delay
```

---

### Prueba 15: Prueba de múltiples usuarios (opcional)

1. Mantén el stream activo
2. Abre la aplicación desde otro dispositivo en la misma red:
   ```
   http://[IP-de-raspberry]:4200/myolab
   ```

**Resultado esperado:**
- Ambos usuarios ven el mismo stream
- No hay degradación significativa de rendimiento
- Latencia similar en ambos clientes

---

## 📊 Checklist de Pruebas Completo

### Backend (Raspberry Pi)
- [ ] Cámara USB detectada en /dev/video0
- [ ] mjpeg-streamer instalado correctamente
- [ ] Stream accesible en http://localhost:8080
- [ ] Stream accesible desde red local
- [ ] Servicio systemd funcionando
- [ ] Logs sin errores

### Frontend (Angular)
- [ ] camera-stream.service.ts creado
- [ ] lab-workspace.ts actualizado sin errores
- [ ] lab-workspace.html actualizado
- [ ] lab-workspace.scss con estilos correctos
- [ ] Compilación sin errores de TypeScript
- [ ] Aplicación inicia correctamente

### Integración
- [ ] Stream visible en el panel del laboratorio
- [ ] Estado de carga funciona
- [ ] Estado de error funciona
- [ ] Botón "Reintentar" funciona
- [ ] Badge "EN VIVO" visible cuando está activo
- [ ] Detección de manos funciona simultáneamente
- [ ] Latencia < 500ms
- [ ] No hay errores en consola del navegador

---

## 🐛 Registro de Problemas Encontrados

Usa esta sección para documentar problemas durante las pruebas:

### Problema 1:
**Descripción:**

**Solución:**

### Problema 2:
**Descripción:**

**Solución:**

---

## ✅ Resultados Finales

Una vez completadas todas las pruebas:

**Estado del Sistema:**
- [ ] ✅ Todas las pruebas pasaron
- [ ] ⚠️ Algunas pruebas fallaron (ver registro de problemas)
- [ ] ❌ Sistema no funcional

**Rendimiento:**
- Latencia medida: _______ ms
- Framerate observado: _______ fps
- Calidad del video: Excelente / Buena / Regular / Mala

**Notas adicionales:**

---

## 📝 Próximos Pasos

Después de las pruebas exitosas:

1. [ ] Configurar auto-inicio del servicio
2. [ ] Documentar configuración final
3. [ ] Entrenar a usuarios finales
4. [ ] Monitorear rendimiento en producción
5. [ ] Considerar optimizaciones (si es necesario)

---

**Fecha de prueba:** ______________
**Probado por:** ______________
**Versión de software:** ViLearning v1.0
