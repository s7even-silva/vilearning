import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  category?: string;
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.scss']
})
export class Quiz {
  @Output() onComplete = new EventEmitter<number>();

  currentQuestionIndex: number = 0;
  score: number = 0;
  selectedAnswer: number | null = null;
  answerSubmitted: boolean = false;

  questions: QuizQuestion[] = [
    // Bloque 1 – Fundamentos técnicos
    {
      question: '¿Qué librería de inteligencia artificial se utiliza para detectar los puntos de la mano en tiempo real?',
      options: [
        'MediaPipe Hands',
        'TensorFlow Lite',
        'OpenCV DNN',
        'YOLO v8'
      ],
      correct: 0,
      explanation: 'MediaPipe Hands es una librería de Google especializada en la detección de manos y el seguimiento de 21 puntos clave (landmarks) en tiempo real, optimizada para navegadores y dispositivos móviles.',
      category: 'Fundamentos técnicos'
    },
    {
      question: '¿Qué función cumple OpenCV en este tipo de sistemas de visión artificial?',
      options: [
        'Entrenar el modelo de inteligencia artificial desde cero',
        'Detectar automáticamente los gestos sin usar MediaPipe',
        'Procesar imágenes, aplicar filtros y realizar operaciones visuales previas',
        'Enviar comandos directamente al microcontrolador ESP32'
      ],
      correct: 2,
      explanation: 'OpenCV (Open Source Computer Vision Library) es una biblioteca fundamental para el procesamiento de imágenes. Se utiliza para capturar video, aplicar filtros, transformaciones geométricas, conversión de espacios de color y preparar las imágenes para análisis posteriores.',
      category: 'Fundamentos técnicos'
    },
    {
      question: '¿Por qué la visión artificial puede reemplazar a los sensores EMG tradicionales en prótesis mioeléctricas?',
      options: [
        'Porque es más económica y no requiere contacto directo con la piel',
        'Porque los sensores EMG no funcionan correctamente',
        'Porque la visión artificial es más rápida que los músculos',
        'Porque MediaPipe puede leer señales eléctricas musculares'
      ],
      correct: 0,
      explanation: 'La visión artificial basada en cámaras ofrece una alternativa no invasiva y más accesible que los sensores electromiográficos (EMG), que requieren contacto con la piel y calibración compleja. Además, reduce costos y simplifica el sistema de control.',
      category: 'Fundamentos técnicos'
    },
    {
      question: '¿Cuántos puntos clave (landmarks) detecta MediaPipe Hands en cada mano?',
      options: [
        '15 puntos',
        '18 puntos',
        '21 puntos',
        '25 puntos'
      ],
      correct: 2,
      explanation: 'MediaPipe Hands detecta exactamente 21 puntos clave en cada mano, cubriendo las articulaciones de los cinco dedos, la palma y la muñeca. Estos puntos permiten reconstruir la posición espacial completa de la mano.',
      category: 'Fundamentos técnicos'
    },

    // Bloque 2 – Reconocimiento y control
    {
      question: '¿Cómo se procesan los gestos detectados para clasificarlos (puño, mano abierta, etc.)?',
      options: [
        'Se usa un algoritmo que analiza las distancias y ángulos entre los landmarks',
        'Se entrena una red neuronal convolucional desde cero',
        'Se compara directamente la imagen con un banco de fotos',
        'MediaPipe envía el gesto ya clasificado sin procesamiento adicional'
      ],
      correct: 0,
      explanation: 'Después de obtener los 21 landmarks de MediaPipe, se calculan distancias euclidianas, ángulos entre articulaciones y relaciones geométricas para determinar si cada dedo está extendido o contraído. Con base en estas mediciones, se clasifica el gesto mediante reglas o algoritmos de clasificación.',
      category: 'Reconocimiento y control'
    },
    {
      question: '¿Qué protocolo de comunicación se utiliza para transmitir los comandos de la aplicación web al microcontrolador?',
      options: [
        'HTTP GET/POST',
        'WebSocket',
        'MQTT',
        'Bluetooth Low Energy'
      ],
      correct: 1,
      explanation: 'WebSocket es un protocolo de comunicación bidireccional en tiempo real que permite mantener una conexión persistente entre el navegador y el servidor. Es ideal para aplicaciones que requieren baja latencia y actualización continua de datos, como el control de hardware en tiempo real.',
      category: 'Reconocimiento y control'
    },
    {
      question: '¿Qué microcontrolador se emplea para controlar los servomotores de la prótesis robótica?',
      options: [
        'Arduino UNO',
        'Raspberry Pi Pico',
        'ESP32',
        'STM32'
      ],
      correct: 2,
      explanation: 'El ESP32 es un microcontrolador con WiFi y Bluetooth integrados, ideal para proyectos de IoT. Permite recibir comandos vía WebSocket y controlar múltiples servomotores simultáneamente mediante sus pines PWM.',
      category: 'Reconocimiento y control'
    },
    {
      question: '¿Qué comandos se envían al ESP32 cuando se detecta que un dedo está extendido o contraído?',
      options: [
        'Se envía el número del dedo y el ángulo del servo (ej: 10° para extendido, 85° para contraído)',
        'Se envía una imagen del gesto completo',
        'Se envía solo el nombre del gesto (ej: "puño cerrado")',
        'Se envía una señal binaria ON/OFF por cada dedo'
      ],
      correct: 0,
      explanation: 'El sistema envía comandos específicos que indican el ángulo al que debe moverse cada servomotor. Típicamente, un dedo extendido corresponde a un ángulo pequeño (ej: 10°) y un dedo contraído a un ángulo mayor (ej: 85°). Esto permite un control preciso y gradual del movimiento de la prótesis.',
      category: 'Reconocimiento y control'
    },

    // Bloque 3 – Análisis del comportamiento
    {
      question: '¿Qué factores pueden afectar la precisión de la detección de MediaPipe?',
      options: [
        'Iluminación deficiente, mano fuera del encuadre, o movimientos muy rápidos',
        'El color de la piel del usuario',
        'La marca de la cámara web',
        'La velocidad de internet'
      ],
      correct: 0,
      explanation: 'MediaPipe Hands funciona mejor con buena iluminación, mano visible en el encuadre y movimientos controlados. La iluminación insuficiente, sombras fuertes o movimientos bruscos pueden reducir la precisión de la detección de landmarks.',
      category: 'Análisis del comportamiento'
    },
    {
      question: '¿Qué tipo de errores puede experimentar el sistema de reconocimiento de gestos?',
      options: [
        'Falsos positivos (detectar un gesto incorrecto) y falsos negativos (no detectar ningún gesto)',
        'Solo errores de conexión WiFi',
        'Solo problemas de batería del ESP32',
        'MediaPipe nunca comete errores'
      ],
      correct: 0,
      explanation: 'Como cualquier sistema de visión artificial, puede haber falsos positivos (clasificar incorrectamente un gesto) o falsos negativos (no detectar la mano o gesto). Estos errores pueden deberse a condiciones ambientales, posición de la mano o limitaciones del algoritmo de clasificación.',
      category: 'Análisis del comportamiento'
    },
    {
      question: '¿Qué métrica se utiliza comúnmente para evaluar la confianza de la detección en modelos de visión artificial?',
      options: [
        'Latencia de respuesta',
        'Score de confianza o confidence score (valor entre 0 y 1)',
        'Resolución de la cámara',
        'Número de dedos detectados'
      ],
      correct: 1,
      explanation: 'Los modelos de visión artificial como MediaPipe retornan un confidence score (puntaje de confianza) que indica qué tan segura es la detección. Valores cercanos a 1 indican alta confianza, mientras que valores bajos sugieren detecciones inciertas que pueden requerir filtrado adicional.',
      category: 'Análisis del comportamiento'
    },
    {
      question: '¿Por qué es importante aplicar un filtro de suavizado (smoothing) a los datos de landmarks en tiempo real?',
      options: [
        'Para evitar movimientos bruscos y oscilaciones en la prótesis causadas por ruido en la detección',
        'Para aumentar la velocidad de procesamiento',
        'Para reducir el consumo de memoria RAM',
        'Para cambiar el color de los landmarks en pantalla'
      ],
      correct: 0,
      explanation: 'El suavizado o filtrado temporal (por ejemplo, con filtros de media móvil o Kalman) reduce el ruido y las oscilaciones en las posiciones detectadas, lo que resulta en movimientos más fluidos y naturales de la prótesis, evitando tirones o vibraciones indeseadas.',
      category: 'Análisis del comportamiento'
    },

    // Bloque 4 – Aplicaciones biomédicas y éticas
    {
      question: '¿Qué aplicación biomédica tiene este tipo de tecnología además del control de prótesis?',
      options: [
        'Rehabilitación física, lenguaje de señas, interfaces humano-computadora accesibles',
        'Solo videojuegos',
        'Únicamente aplicaciones militares',
        'Control de drones de carreras'
      ],
      correct: 0,
      explanation: 'La detección de gestos mediante visión artificial tiene múltiples aplicaciones médicas y sociales: rehabilitación de pacientes con problemas motores, traducción automática de lenguaje de señas, interfaces accesibles para personas con discapacidad, control de dispositivos médicos, y terapia ocupacional.',
      category: 'Aplicaciones biomédicas y éticas'
    },
    {
      question: '¿Cómo contribuye este laboratorio remoto a la educación en ingeniería biomédica?',
      options: [
        'Permite experimentar con hardware real de forma remota, democratizando el acceso a equipos costosos',
        'Reemplaza completamente la necesidad de aprender teoría',
        'Solo sirve para tomar exámenes',
        'No tiene valor educativo real'
      ],
      correct: 0,
      explanation: 'Los laboratorios remotos permiten que estudiantes de cualquier ubicación geográfica puedan experimentar con hardware real sin necesidad de estar físicamente presentes. Esto democratiza el acceso a equipos costosos o especializados, especialmente en contextos de educación a distancia o en instituciones con recursos limitados.',
      category: 'Aplicaciones biomédicas y éticas'
    },
    {
      question: '¿Qué consideraciones éticas deben tenerse en cuenta al desarrollar sistemas de visión artificial que capturan imágenes de usuarios?',
      options: [
        'Privacidad de datos, consentimiento informado, seguridad de la información y transparencia',
        'Solo la velocidad del sistema',
        'Únicamente el costo del hardware',
        'No hay consideraciones éticas necesarias'
      ],
      correct: 0,
      explanation: 'Es fundamental respetar la privacidad del usuario, obtener consentimiento informado para capturar imágenes, garantizar que los datos no se almacenen sin autorización, y ser transparente sobre cómo se procesan y utilizan las imágenes. Además, se debe cumplir con regulaciones como GDPR o leyes locales de protección de datos.',
      category: 'Aplicaciones biomédicas y éticas'
    },
    {
      question: '¿Qué ventaja tiene el uso de IA y visión artificial frente a prótesis tradicionales controladas por botones o joysticks?',
      options: [
        'Control más intuitivo y natural, imitando movimientos reales de la mano del usuario',
        'Son más baratas siempre',
        'No requieren ningún entrenamiento del usuario',
        'Funcionan sin electricidad'
      ],
      correct: 0,
      explanation: 'El control mediante visión artificial permite una interacción más natural e intuitiva, ya que el usuario simplemente mueve su mano en lugar de presionar botones o mover joysticks. Esto reduce la curva de aprendizaje y permite movimientos más fluidos y precisos, mejorando la experiencia del usuario.',
      category: 'Aplicaciones biomédicas y éticas'
    },

    // Bloque 5 – Integración y reflexión
    {
      question: '¿Cuál es el flujo completo de información desde la cámara hasta la prótesis?',
      options: [
        'Cámara → MediaPipe (landmarks) → Clasificación de gestos → WebSocket → ESP32 → Servomotores',
        'Cámara → ESP32 → Servomotores',
        'MediaPipe → Servidor → Cámara → Prótesis',
        'Cámara → Internet → Prótesis'
      ],
      correct: 0,
      explanation: 'El flujo es: 1) La cámara captura video, 2) MediaPipe detecta 21 landmarks de la mano, 3) Un algoritmo clasifica el gesto basándose en las posiciones de los landmarks, 4) El gesto se envía vía WebSocket al servidor, 5) El ESP32 recibe el comando y 6) Los servomotores mueven los dedos de la prótesis a las posiciones correspondientes.',
      category: 'Integración y reflexión'
    },
    {
      question: '¿Qué tipo de retroalimentación recibe el usuario para saber que la prótesis está respondiendo correctamente?',
      options: [
        'Visualización en tiempo real del stream de video de la prótesis y estado de dedos en pantalla',
        'Solo un mensaje de texto',
        'No hay retroalimentación visual',
        'Una alarma sonora'
      ],
      correct: 0,
      explanation: 'El sistema proporciona retroalimentación visual multimodal: 1) Stream en vivo de la cámara USB mostrando el movimiento real de la prótesis, 2) Visualización del estado de cada dedo (extendido/contraído) en la interfaz web, y 3) Detección de landmarks en tiempo real sobre el video de la mano del usuario.',
      category: 'Integración y reflexión'
    },
    {
      question: 'Si el sistema de visión artificial falla, ¿cuál podría ser una estrategia de respaldo o fallback?',
      options: [
        'Cambiar a control manual por teclado o interfaz táctil alternativa',
        'Apagar completamente la prótesis',
        'Reiniciar el ordenador cada vez',
        'No se puede hacer nada'
      ],
      correct: 0,
      explanation: 'Una buena práctica de ingeniería es implementar sistemas de respaldo (fallback mechanisms). En caso de fallo de la detección visual, se puede cambiar a un modo de control alternativo como teclado, interfaz táctil, control por voz, o incluso sensores EMG físicos, garantizando que el usuario no pierda completamente el control de la prótesis.',
      category: 'Integración y reflexión'
    },
    {
      question: '¿Qué diferencias fundamentales existen entre una prótesis controlada por IA y visión, y una prótesis mioeléctrica tradicional?',
      options: [
        'La tradicional lee señales musculares con electrodos; la de IA interpreta movimientos visuales de la mano',
        'No hay ninguna diferencia',
        'La tradicional usa WiFi y la de IA usa cables',
        'La de IA no puede controlar dedos individuales'
      ],
      correct: 0,
      explanation: 'Las prótesis mioeléctricas tradicionales utilizan sensores EMG colocados en la piel que captan señales eléctricas de los músculos remanentes. En contraste, el sistema basado en visión artificial utiliza cámaras para detectar gestos de la mano contralateral (la mano sana), ofreciendo una alternativa no invasiva que no requiere colocar electrodos ni calibración muscular.',
      category: 'Integración y reflexión'
    }
  ];

  get currentQuestion(): QuizQuestion {
    return this.questions[this.currentQuestionIndex];
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  selectAnswer(index: number): void {
    if (!this.answerSubmitted) {
      this.selectedAnswer = index;
    }
  }

  submitAnswer(): void {
    if (this.selectedAnswer === null) return;

    this.answerSubmitted = true;

    if (this.selectedAnswer === this.currentQuestion.correct) {
      this.score++;
    }
  }

  nextQuestion(): void {
    if (!this.isLastQuestion) {
      this.currentQuestionIndex++;
      this.selectedAnswer = null;
      this.answerSubmitted = false;
    } else {
      this.onComplete.emit(this.score);
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
