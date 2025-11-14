#!/bin/bash

# ============================================
# Script para configurar el servicio systemd
# de mjpeg-streamer
# ============================================

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

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    print_error "Por favor ejecuta este script como root (usa sudo)"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/mjpeg-streamer.service"

if [ ! -f "$SERVICE_FILE" ]; then
    print_error "No se encontró el archivo mjpeg-streamer.service"
    exit 1
fi

print_info "Copiando archivo de servicio a /etc/systemd/system/..."
cp "$SERVICE_FILE" /etc/systemd/system/

if [ $? -eq 0 ]; then
    print_status "Archivo de servicio copiado"
else
    print_error "Error al copiar archivo de servicio"
    exit 1
fi

print_info "Recargando configuración de systemd..."
systemctl daemon-reload

print_info "Habilitando servicio mjpeg-streamer..."
systemctl enable mjpeg-streamer.service

if [ $? -eq 0 ]; then
    print_status "Servicio habilitado para inicio automático"
else
    print_error "Error al habilitar servicio"
    exit 1
fi

print_info "Iniciando servicio mjpeg-streamer..."
systemctl start mjpeg-streamer.service

sleep 2

# Verificar estado
if systemctl is-active --quiet mjpeg-streamer.service; then
    print_status "Servicio iniciado correctamente"
    echo ""
    systemctl status mjpeg-streamer.service --no-pager
    echo ""
    print_info "El servicio se iniciará automáticamente al arrancar el sistema"
    print_info "Comandos útiles:"
    echo "  - Ver estado: sudo systemctl status mjpeg-streamer"
    echo "  - Detener: sudo systemctl stop mjpeg-streamer"
    echo "  - Iniciar: sudo systemctl start mjpeg-streamer"
    echo "  - Reiniciar: sudo systemctl restart mjpeg-streamer"
    echo "  - Ver logs: sudo journalctl -u mjpeg-streamer -f"
else
    print_error "Error al iniciar el servicio"
    print_info "Verifica los logs con: sudo journalctl -u mjpeg-streamer -n 50"
    exit 1
fi
