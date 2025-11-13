/**
 * Cliente WebSocket ESP32 para ViLearning
 *
 * Este código se conecta al servidor WebSocket en la Raspberry Pi
 * y controla 5 servomotores basándose en los comandos recibidos.
 *
 * Librerías necesarias:
 * - WebSocketsClient by Links2004 (v2.4.1+)
 * - ESP32Servo by Kevin Harrington
 *
 * Instalar desde Arduino IDE Library Manager o PlatformIO
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

// ===== CONFIGURACIÓN WIFI =====
const char* ssid = "TU_RED_WIFI";           // Cambiar por tu SSID
const char* password = "TU_PASSWORD_WIFI";  // Cambiar por tu contraseña

// ===== CONFIGURACIÓN WEBSOCKET =====
const char* wsHost = "192.168.1.100";  // Cambiar por la IP de tu Raspberry Pi
const uint16_t wsPort = 3001;
const char* wsPath = "/?client=esp32";

// ===== CONFIGURACIÓN DE SERVOS =====
// Pines GPIO del ESP32 para cada servo (ajustar según tu cableado)
const int servoPins[5] = {18, 19, 21, 22, 23};

// Nombres de los dedos para debugging
const char* fingerNames[5] = {"Pulgar", "Indice", "Medio", "Anular", "Meñique"};

// Objetos servo
Servo servos[5];

// Cliente WebSocket
WebSocketsClient webSocket;

// Variables de estado
bool wifiConnected = false;
bool wsConnected = false;
unsigned long lastReconnectAttempt = 0;
const unsigned long reconnectInterval = 5000;  // Reintentar cada 5 segundos

// ===== SETUP =====
void setup() {
  // Inicializar Serial para debugging
  Serial.begin(115200);
  Serial.println("\n\n=== ViLearning ESP32 Client ===");

  // Inicializar servos
  initServos();

  // Conectar a WiFi
  connectWiFi();

  // Configurar WebSocket
  setupWebSocket();
}

// ===== LOOP PRINCIPAL =====
void loop() {
  // Mantener conexión WebSocket
  webSocket.loop();

  // Verificar reconexión WiFi si se perdió
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    Serial.println("WiFi desconectado. Reconectando...");
    connectWiFi();
  }
}

// ===== INICIALIZAR SERVOS =====
void initServos() {
  Serial.println("Inicializando servos...");

  for (int i = 0; i < 5; i++) {
    servos[i].attach(servoPins[i]);
    servos[i].write(0);  // Posición inicial (extendido)
    Serial.print("  - Servo ");
    Serial.print(i + 1);
    Serial.print(" (");
    Serial.print(fingerNames[i]);
    Serial.print(") en pin GPIO ");
    Serial.println(servoPins[i]);
  }

  Serial.println("Servos inicializados correctamente");
  delay(500);
}

// ===== CONECTAR A WIFI =====
void connectWiFi() {
  Serial.print("Conectando a WiFi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\nWiFi conectado!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\nError: No se pudo conectar a WiFi");
    Serial.println("Verificar SSID y contraseña");
  }
}

// ===== CONFIGURAR WEBSOCKET =====
void setupWebSocket() {
  if (!wifiConnected) {
    Serial.println("Error: WiFi no conectado. No se puede configurar WebSocket");
    return;
  }

  Serial.println("\nConfigurando WebSocket...");
  Serial.print("  - Host: ");
  Serial.println(wsHost);
  Serial.print("  - Puerto: ");
  Serial.println(wsPort);
  Serial.print("  - Path: ");
  Serial.println(wsPath);

  // Configurar WebSocket
  webSocket.begin(wsHost, wsPort, wsPath);

  // Asignar callback de eventos
  webSocket.onEvent(webSocketEvent);

  // Configurar reconexión automática
  webSocket.setReconnectInterval(5000);

  Serial.println("WebSocket configurado");
}

// ===== CALLBACK DE EVENTOS WEBSOCKET =====
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("[WS] Desconectado del servidor");
      break;

    case WStype_CONNECTED:
      wsConnected = true;
      Serial.print("[WS] Conectado al servidor: ");
      Serial.println((char*)payload);

      // Enviar mensaje de confirmación al servidor
      sendConnectionConfirmation();
      break;

    case WStype_TEXT:
      Serial.print("[WS] Mensaje recibido: ");
      Serial.println((char*)payload);

      // Procesar comando
      handleMessage((char*)payload);
      break;

    case WStype_ERROR:
      Serial.print("[WS] Error: ");
      Serial.println((char*)payload);
      break;

    case WStype_PING:
      Serial.println("[WS] Ping recibido");
      break;

    case WStype_PONG:
      Serial.println("[WS] Pong recibido");
      break;

    default:
      break;
  }
}

// ===== ENVIAR CONFIRMACIÓN DE CONEXIÓN =====
void sendConnectionConfirmation() {
  StaticJsonDocument<128> doc;
  doc["type"] = "esp32_connected";
  doc["timestamp"] = millis();

  String message;
  serializeJson(doc, message);

  webSocket.sendTXT(message);
  Serial.println("[WS] Confirmación de conexión enviada");
}

// ===== MANEJAR MENSAJE RECIBIDO =====
void handleMessage(char* payload) {
  // Parsear JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload);

  if (error) {
    Serial.print("[ERROR] Error al parsear JSON: ");
    Serial.println(error.c_str());
    return;
  }

  // Obtener tipo de mensaje
  const char* type = doc["type"];

  if (strcmp(type, "motor_command") == 0) {
    // Es un comando de motor
    const char* commandData = doc["data"];

    if (commandData != nullptr) {
      Serial.print("[MOTOR] Comando recibido: ");
      Serial.println(commandData);

      // Ejecutar comando
      executeMotorCommand(commandData);
    } else {
      Serial.println("[ERROR] Comando sin datos");
    }
  } else if (strcmp(type, "ping") == 0) {
    // Responder a ping
    sendPong();
  } else {
    Serial.print("[INFO] Tipo de mensaje desconocido: ");
    Serial.println(type);
  }
}

// ===== EJECUTAR COMANDO DE MOTORES =====
void executeMotorCommand(const char* command) {
  // Formato del comando: "1,0;2,150;3,0;4,150;5,150"
  // Donde cada par es: servoNum,angle

  String commandStr = String(command);
  int startIndex = 0;

  Serial.println("[MOTOR] Ejecutando comandos:");

  // Parsear cada comando separado por punto y coma
  while (startIndex < commandStr.length()) {
    int semicolonIndex = commandStr.indexOf(';', startIndex);

    if (semicolonIndex == -1) {
      semicolonIndex = commandStr.length();
    }

    // Extraer un comando individual "servoNum,angle"
    String singleCommand = commandStr.substring(startIndex, semicolonIndex);

    // Parsear servoNum y angle
    int commaIndex = singleCommand.indexOf(',');

    if (commaIndex != -1) {
      int servoNum = singleCommand.substring(0, commaIndex).toInt();
      int angle = singleCommand.substring(commaIndex + 1).toInt();

      // Validar servo number (1-5)
      if (servoNum >= 1 && servoNum <= 5) {
        // Validar ángulo (0-180)
        if (angle >= 0 && angle <= 180) {
          // Mover servo (servoNum-1 porque el array es 0-indexed)
          servos[servoNum - 1].write(angle);

          Serial.print("  - Servo ");
          Serial.print(servoNum);
          Serial.print(" (");
          Serial.print(fingerNames[servoNum - 1]);
          Serial.print("): ");
          Serial.print(angle);
          Serial.println("°");
        } else {
          Serial.print("  - [ERROR] Ángulo inválido para servo ");
          Serial.print(servoNum);
          Serial.print(": ");
          Serial.println(angle);
        }
      } else {
        Serial.print("  - [ERROR] Número de servo inválido: ");
        Serial.println(servoNum);
      }
    }

    // Avanzar al siguiente comando
    startIndex = semicolonIndex + 1;
  }

  Serial.println("[MOTOR] Comandos ejecutados");
}

// ===== ENVIAR PONG =====
void sendPong() {
  StaticJsonDocument<128> doc;
  doc["type"] = "pong";
  doc["timestamp"] = millis();

  String message;
  serializeJson(doc, message);

  webSocket.sendTXT(message);
}

// ===== OPCIONAL: ENVIAR ESTADO DE MOTORES =====
void sendMotorStatus() {
  StaticJsonDocument<256> doc;
  doc["type"] = "motor_status";
  doc["timestamp"] = millis();

  JsonObject data = doc.createNestedObject("data");

  for (int i = 0; i < 5; i++) {
    String key = "servo" + String(i + 1);
    data[key] = servos[i].read();
  }

  String message;
  serializeJson(doc, message);

  webSocket.sendTXT(message);
  Serial.println("[WS] Estado de motores enviado");
}
