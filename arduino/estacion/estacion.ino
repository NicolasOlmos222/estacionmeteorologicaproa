#include <DHT.h>
#include "I2Cdev.h"
#include "MPU6050.h"

// PINES
#define DHT_PIN 6
#define LEDERROR_PIN 10  
#define RELE_PIN 7
#define LLUVIA_PIN A2
#define NIVELAGUA_PIN A1
#define SCL_PIN A5
#define SDA_PIN A4

#define LUZ_PIN 12 //AGREGAR

#define LEDAVISO_PIN 9
#define TX_PIN 2
#define ANEMOMETRO_PIN 3  
#define PIN_BOTON 5
#define SERVO_PIN 11

#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);
MPU6050 mpu;

unsigned long tiempoAnteriorLed = 0; 
const long intervaloLed = 1000;  
const long intervaloLed2 = 2000;       
int estadoLed = LOW;               

// Variables para el MPU6050
int16_t gx, gy, gz;
int16_t ax, ay, az;

// --- VARIABLES DEL BOTÓN Y MODO TEST ---
bool ultimoEstadoBoton = LOW;
unsigned long ultimoTiempoRebote = 0;
const unsigned long retrasoRebote = 50; // 50ms para evitar falsos clics
bool testON = false; // Por defecto inicia en falso, puedes cambiarlo a true desde el código si quieres

// --- VARIABLES ANEMÓMETRO ---
volatile unsigned long contadorVueltas = 0;
unsigned long tiempoAnteriorViento = 0;
const unsigned long intervaloViento = 1000; 
float velocidadVientoActual = 0.0;
const float factorCalibracion = 2.4; 

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  #if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
    Wire.begin(); 
  #elif I2CDEV_IMPLEMENTATION == I2CDEV_BUILTIN_FASTWIRE
    Fastwire::setup(400, true);
  #endif
  
  mpu.initialize();
  if(mpu.testConnection() == false){
    Serial.println("MPU6050 connection failed");
  }

  mpu.setXGyroOffset(0);  
  mpu.setYGyroOffset(0);  
  mpu.setZGyroOffset(0);  
  
  pinMode(RELE_PIN, OUTPUT);
  pinMode(LLUVIA_PIN, INPUT);
  pinMode(LEDAVISO_PIN, OUTPUT);
  pinMode(LEDERROR_PIN, OUTPUT);
  pinMode(TX_PIN, OUTPUT);
  pinMode(ANEMOMETRO_PIN, INPUT); 
  pinMode(SERVO_PIN, OUTPUT);
  pinMode(PIN_BOTON, INPUT);      

  attachInterrupt(digitalPinToInterrupt(ANEMOMETRO_PIN), contarVuelta, RISING);

  controlarRele(false);
  randomSeed(analogRead(A0));
}
 
void loop() {
  // --- LECTURA DEL BOTÓN CON DEBOUNCE (ENTRAR/SALIR DEL MODO TEST) ---
  bool lecturaBoton = !digitalRead(PIN_BOTON);
  Serial.println(lecturaBoton);
  
    if (lecturaBoton == HIGH) {
      testON = !testON; 
      if(testON) {
        Serial.println(">>> MODO TEST ACTIVADO <<<");
      } else {
        Serial.println(">>> MODO REAL ACTIVADO <<<");
      }
      delay(500);
    }
  


  // --- CÁLCULO DE VELOCIDAD DEL VIENTO ---
  unsigned long tiempoActual = millis();
  if (tiempoActual - tiempoAnteriorViento >= intervaloViento) {
    tiempoAnteriorViento = tiempoActual;
    
    noInterrupts(); 
    unsigned long vueltas = contadorVueltas;
    contadorVueltas = 0;
    interrupts();
    
    velocidadVientoActual = vueltas * factorCalibracion;
  }

  // --- CONTROL SERIAL (TAMBIÉN PUEDES ACTIVAR/DESACTIVAR TEST DESDE AQUÍ) ---
  if (Serial.available() > 0) {
    String comando = Serial.readString();
    comando.trim();

    if (comando == "R1") {
      controlarRele(true);
    } 
    else if (comando == "R0") {
      controlarRele(false);
    }
    else if (comando == "TEST1") {  // Comando serial para forzar Test
      testON = true;
      Serial.println(">>> MODO TEST FORZADO POR SERIAL <<<");
    }
    else if (comando == "TEST0") {  // Comando serial para salir de Test
      testON = false;
      Serial.println(">>> MODO REAL FORZADO POR SERIAL <<<");
    }
  }

  // --- CONTROL DE FLUJO: ¿MODO TEST O MODO REAL? ---
  if (testON == true) {
      avisoError(3);
      TEST(); // Ejecuta una ráfaga de datos aleatorios
  } else {
      // MODO REAL
      String lectura = "";

      String valorT = obtenerTemperatura();
      lectura = lectura + valorT;

      lectura = modularLluviaAgua(lectura);

      String valor = obtenerGiroscopio();
      lectura = lectura + valor;

      lectura = lectura + "-V" + String(velocidadVientoActual, 1);

      Serial.println(lectura);

      if (valorT == "H999-T999-I999"){
        avisoError(1);
      } else if (valor == "-D999"){
        avisoError(2);
      } else {
        avisoError(0);
      }
  }

  delay(100);
}

// --- FUNCIÓN TEST MODIFICADA (SIN BUCLE INFINITO) ---
void TEST(){
  int valorAleatorio = random(0, 50);
  String prueba = "H" + String(valorAleatorio) + "-T" + String(valorAleatorio) + "-I" + String(valorAleatorio);
  valorAleatorio = random(0, 2);
  prueba = prueba + "-L" + String(valorAleatorio);
  valorAleatorio = random(0, 30);
  prueba = prueba + "-A" + String(valorAleatorio);
  valorAleatorio = random(0, 360);
  prueba = prueba + "-D" + String(valorAleatorio);
  valorAleatorio = random(0, 100);
  prueba = prueba + "-V" + String(valorAleatorio);
  
  Serial.println(prueba);
}

// --- NUEVA FUNCIÓN: LECTURA DEL MPU6050 ---
String obtenerGiroscopio(){
  if(mpu.testConnection() ==  false){
    return "-D999";
  } else {
    mpu.getAcceleration(&ax, &ay, &az);

    float angulo = atan2((float)ay, (float)ax) * 180.0 / PI;
    if (angulo < 0) {
      angulo += 360.0;
    }

    return "-D" + String(angulo, 1);
  }
}

String modularLluviaAgua(String stringBase) {
  int valorLluvia = analogRead(LLUVIA_PIN);
  if (valorLluvia < 102){
    stringBase = stringBase + "-L1";
  } else {
    stringBase = stringBase + "-L0";
  }

  int valorAgua = analogRead(NIVELAGUA_PIN);
  stringBase = stringBase + "-A" + String(valorAgua);  
  
  return stringBase;
}

// --- OBTENER TEMPERATURA ---
String obtenerTemperatura(){
  float h = dht.readHumidity();
  float t = dht.readTemperature();
 
  if (isnan(h) || isnan(t)) {
    return "H999-T999-I999";
  }
  float hic = dht.computeHeatIndex(t, h, false);

  String datos = "H" + String(h) + "-T" + String(t) + "-I" + String(hic);
  return datos;
}

// --- AVISO DE ERROR (BLINK) ---
void avisoError(int error){
  if (error == 0){
    digitalWrite(LEDERROR_PIN, LOW);
    estadoLed = LOW;
  } 
  else if (error == 1){
    unsigned long tiempoActual = millis();
    if (tiempoActual - tiempoAnteriorLed >= intervaloLed) {
      tiempoAnteriorLed = tiempoActual;
      if (estadoLed == LOW) {
        estadoLed = HIGH;
      } else {
        estadoLed = LOW;
      }
      digitalWrite(LEDERROR_PIN, estadoLed);
    }
  } else if (error == 2){
    unsigned long tiempoActual = millis();
    if (tiempoActual - tiempoAnteriorLed >= intervaloLed2) {
      tiempoAnteriorLed = tiempoActual;
      if (estadoLed == LOW) {
        estadoLed = HIGH;
      } else {
        estadoLed = LOW;
      }
      digitalWrite(LEDERROR_PIN, estadoLed);
    }
  } else if (error == 3){
    digitalWrite(LEDERROR_PIN, HIGH);
  }
}

// --- CONTROL DEL RELÉ ---
void controlarRele(bool encender) {
  if (encender) {
    digitalWrite(RELE_PIN, HIGH);
  } else {
    digitalWrite(RELE_PIN, LOW);
  }
}

// --- FUNCIÓN DE INTERRUPCIÓN ---
void contarVuelta() {
  contadorVueltas++;
}