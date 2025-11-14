#!/bin/bash

# ============================================
# Script de instalación de MJPEG Streamer
# Para streaming de cámara USB en Raspberry Pi
# ============================================

echo "=========================================="
echo "Instalación de MJPEG Streamer"
echo "=========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    print_error "Por favor ejecuta este script como root (usa sudo)"
    exit 1
fi

print_info "Actualizando repositorios..."
apt-get update

print_info "Instalando dependencias..."
apt-get install -y build-essential git cmake libjpeg-dev imagemagick libv4l-dev v4l-utils

if [ $? -eq 0 ]; then
    print_status "Dependencias instaladas correctamente"
else
    print_error "Error al instalar dependencias"
    exit 1
fi

# Verificar si ya existe mjpg-streamer
if [ -d "$HOME/mjpg-streamer" ]; then
    print_info "mjpg-streamer ya existe. Eliminando versión anterior..."
    rm -rf $HOME/mjpg-streamer
fi

print_info "Clonando repositorio de mjpg-streamer..."
cd $HOME
git clone https://github.com/jacksonliam/mjpg-streamer.git

if [ $? -eq 0 ]; then
    print_status "Repositorio clonado correctamente"
else
    print_error "Error al clonar repositorio"
    exit 1
fi

print_info "Compilando mjpg-streamer..."
cd mjpg-streamer/mjpg-streamer-experimental
make

if [ $? -eq 0 ]; then
    print_status "Compilación exitosa"
else
    print_error "Error en la compilación"
    exit 1
fi

print_info "Instalando mjpg-streamer..."
make install

if [ $? -eq 0 ]; then
    print_status "mjpg-streamer instalado correctamente"
else
    print_error "Error en la instalación"
    exit 1
fi

print_info "Verificando dispositivos de video..."
ls -l /dev/video* 2>/dev/null

if [ $? -eq 0 ]; then
    print_status "Dispositivos de video encontrados:"
    v4l2-ctl --list-devices
else
    print_error "No se encontraron dispositivos de video"
    print_info "Asegúrate de que la cámara USB esté conectada"
fi

# Agregar usuario al grupo video
ACTUAL_USER=$(logname)
print_info "Agregando usuario $ACTUAL_USER al grupo video..."
usermod -a -G video $ACTUAL_USER

print_status "Instalación completada exitosamente!"
echo ""
print_info "Próximos pasos:"
echo "  1. Reconecta tu sesión (logout/login) para aplicar permisos de grupo"
echo "  2. Ejecuta el script start-camera-stream.sh para iniciar el streaming"
echo "  3. Accede al stream en: http://$(hostname -I | awk '{print $1}'):8080/?action=stream"
echo ""
