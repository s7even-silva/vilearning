#!/bin/bash

# ============================================
# Script para iniciar el streaming de cámara USB
# usando mjpeg-streamer
# ============================================

# Configuración
DEVICE="/dev/video0"           # Dispositivo de cámara USB
RESOLUTION="640x480"           # Resolución del video
FRAMERATE="30"                 # Frames por segundo
QUALITY="80"                   # Calidad JPEG (1-100, mayor = mejor calidad)
PORT="8080"                    # Puerto HTTP para el stream
WWW_FOLDER="/usr/local/share/mjpg-streamer/www"  # Carpeta web de mjpeg-streamer

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Verificar si el dispositivo existe
if [ ! -e "$DEVICE" ]; then
    print_error "Dispositivo $DEVICE no encontrado"
    print_info "Dispositivos de video disponibles:"
    ls -l /dev/video* 2>/dev/null || echo "  Ninguno"
    exit 1
fi

# Verificar si mjpg_streamer está instalado
if ! command -v mjpg_streamer &> /dev/null; then
    print_error "mjpg_streamer no está instalado"
    print_info "Ejecuta primero: sudo ./install-camera-streaming.sh"
    exit 1
fi

# Verificar si ya hay una instancia corriendo
if pgrep -x "mjpg_streamer" > /dev/null; then
    print_info "Deteniendo instancia anterior de mjpg_streamer..."
    pkill -9 mjpg_streamer
    sleep 1
fi

print_info "Iniciando streaming de cámara USB..."
print_info "Dispositivo: $DEVICE"
print_info "Resolución: $RESOLUTION @ ${FRAMERATE}fps"
print_info "Calidad: $QUALITY/100"
print_info "Puerto: $PORT"

# Iniciar mjpeg-streamer
mjpg_streamer \
    -i "input_uvc.so -d $DEVICE -r $RESOLUTION -f $FRAMERATE -q $QUALITY" \
    -o "output_http.so -p $PORT -w $WWW_FOLDER" &

# Esperar a que inicie
sleep 2

# Verificar si se inició correctamente
if pgrep -x "mjpg_streamer" > /dev/null; then
    print_status "Streaming iniciado correctamente"
    echo ""
    print_info "Accede al stream en:"
    echo "  http://localhost:$PORT/?action=stream"
    echo "  http://$(hostname -I | awk '{print $1}'):$PORT/?action=stream"
    echo ""
    print_info "Para detener: pkill mjpg_streamer"
else
    print_error "Error al iniciar el streaming"
    print_info "Verifica los logs para más detalles"
    exit 1
fi
