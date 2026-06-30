#include <DHT.h>
#include "I2Cdev.h"

// PINES
#define DHT_PIN 6
#define LEDERROR_PIN 10  
#define RELE_PIN 7
#define LLUVIA_PIN 2
#define NIVELAGUA_PIN A0  // Usando el pin A0 para el nivel de agua
#define LUZ_PIN 12
#define PIN_BOTON 5
#define ANEMOMETRO_PIN 9 

#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

unsigned long tiempoAnteriorLed = 0; 
const long intervaloLed = 1000;  
const long intervaloLed2 = 2000;       
int estadoLed = LOW;               

// --- VARIABLES DEL BOTÓN Y MODO TEST ---
bool ultimoEstadoBoton = LOW;
unsigned long ultimoTiempoRebote = 0;
const unsigned long retrasoRebote = 50; 
bool testON = false; 

// --- VARIABLES ANEMÓMETRO (SIN INTERRUPCIONES) ---
unsigned long contadorVueltas = 0;
bool estadoActualAnemometro = LOW;
bool estadoAnteriorAnemometro = LOW;
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
  
  pinMode(RELE_PIN, OUTPUT);
  pinMode(LLUVIA_PIN, INPUT);
  pinMode(LEDERROR_PIN, OUTPUT);
  pinMode(PIN_BOTON, INPUT);      
  pinMode(LUZ_PIN, INPUT);
  pinMode(ANEMOMETRO_PIN, INPUT); 

  controlarRele(false);
  // Cambiado a A3 para no interferir con la lectura analógica de A0
  randomSeed(analogRead(A3)); 
}
 
void loop() {
  // --- 1. DETECCIÓN DE VUELTAS DEL VIENTO (POR SOFTWARE) ---
  estadoActualAnemometro = digitalRead(ANEMOMETRO_PIN);
  if (estadoActualAnemometro == HIGH && estadoAnteriorAnemometro == LOW) {
    contadorVueltas++;
  }
  estadoAnteriorAnemometro = estadoActualAnemometro;

  // --- 2. CÁLCULO PERIÓDICO DE LA VELOCIDAD ---
  unsigned long tiempoActual = millis();
  if (tiempoActual - tiempoAnteriorViento >= intervaloViento) {
    tiempoAnteriorViento = tiempoActual;
    
    unsigned long vueltas = contadorVueltas;
    contadorVueltas = 0; 
    
    velocidadVientoActual = vueltas * factorCalibracion;
  }

  // --- LECTURA DEL BOTÓN CON DEBOUNCE ---
  bool lecturaBoton = !digitalRead(PIN_BOTON);
  
  if (lecturaBoton == HIGH) {
    testON = !testON; 
    if(testON) {
      Serial.println(">>> MODO TEST ACTIVADO <<<");
    } else {
      Serial.println(">>> MODO REAL ACTIVADO <<<");
    }
    delay(500); 
  }

  // --- CONTROL SERIAL ---
  if (Serial.available() > 0) {
    String comando = Serial.readString();
    comando.trim();

    if (comando == "R1") {
      controlarRele(true);
    } 
    else if (comando == "R0") {
      controlarRele(false);
    }
    else if (comando == "TEST1") {  
      testON = true;
      Serial.println(">>> MODO TEST FORZADO POR SERIAL <<<");
    }
    else if (comando == "TEST0") {  
      testON = false;
      Serial.println(">>> MODO REAL FORZADO POR SERIAL <<<");
    }
  }

  // --- CONTROL DE FLUJO: ¿MODO TEST O MODO REAL? ---
  if (testON == true) {
      avisoError(3);
      TEST(); 
  } else {
      // MODO REAL
      String lectura = "";

      String valorT = obtenerTemperatura();
      lectura = lectura + valorT;

      lectura = modularLluviaAgua(lectura);

      int value = digitalRead(LUZ_PIN);
      if (value == HIGH) {
        lectura = lectura + "-Z1";
      } else {
        lectura = lectura + "-Z0";
      }
      
      lectura = lectura + "-V" + String(velocidadVientoActual, 1);
      
      Serial.println(lectura);

      if (valorT == "H999-T999-I999"){
        avisoError(1);
      } else {
        avisoError(0);
      }
  }
}

// --- FUNCIÓN TEST ---
void TEST(){
  int valorAleatorio = random(0, 50);
  String prueba = "H" + String(valorAleatorio) + "-T" + String(valorAleatorio) + "-I" + String(valorAleatorio);
  valorAleatorio = random(0, 2);
  prueba = prueba + "-L" + String(valorAleatorio);
  valorAleatorio = random(0, 220); // Test ahora genera volumen hasta 220cc
  prueba = prueba + "-A" + String(valorAleatorio);
  valorAleatorio = random(0, 360);
  prueba = prueba + "-D" + String(valorAleatorio);
  valorAleatorio = random(0, 100);
  prueba = prueba + "-V" + String(valorAleatorio);
  
  Serial.println(prueba);
}

// --- MODULAR LLUVIA Y AGUA CON CONVERSIÓN A CC ---
String modularLluviaAgua(String stringBase) {
  int value = digitalRead(LLUVIA_PIN);  
 
  if (value == LOW) {
      stringBase = stringBase + "-L1";
  } else {
    stringBase = stringBase + "-L0";
  }

  // Lectura analógica del agua
  int lecturaAnalogicaAgua = analogRead(NIVELAGUA_PIN);
  
  // Conversión a centímetros cúbicos (cc) aproximados.
  // 0 en seco -> 0 cc
  // 650 completamente sumergido -> 220 cc
  int volumenCC = map(lecturaAnalogicaAgua, 0, 2004, 0, 220);
  
  // Restringir el rango para evitar valores negativos o que superen los 220cc por ruido eléctrico
  volumenCC = constrain(volumenCC, 0, 220);

  stringBase = stringBase + "-A" + String(volumenCC);  
  
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