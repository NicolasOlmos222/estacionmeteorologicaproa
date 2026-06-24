#include <DHT.h>
#include "I2Cdev.h"
#include "MPU6050.h"

// PINES
#define DHT_PIN 6
#define LEDERROR_PIN 10  
#define RELE_PIN 7
#define LLUVIA_PIN A0
#define NIVELAGUA_PIN A1
#define SCL_PIN A5
#define SDA_PIN A4

#define LEDAVISO_PIN 9
#define TX_PIN 2
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

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  // Inicialización del MPU6050
  #if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
    Wire.begin(); 
  #elif I2CDEV_IMPLEMENTATION == I2CDEV_BUILTIN_FASTWIRE
    Fastwire::setup(400, true);
  #endif
  
  mpu.initialize();
  if(mpu.testConnection() == false){
    Serial.println("MPU6050 connection failed");
    while(true);
  }

  // Configuración de Offsets para el Giroscopio
  mpu.setXGyroOffset(0);  
  mpu.setYGyroOffset(0);  
  mpu.setZGyroOffset(0);  
  
  pinMode(RELE_PIN, OUTPUT);
  pinMode(LLUVIA_PIN, INPUT);
  pinMode(LEDAVISO_PIN, OUTPUT);
  pinMode(LEDERROR_PIN, OUTPUT);
  pinMode(TX_PIN, OUTPUT);
  pinMode(SERVO_PIN, OUTPUT);

  controlarRele(false);
}
 
void loop() {
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
  }

  String lectura = "";

  String valorT = obtenerTemperatura();
  lectura = lectura + valorT;

  lectura = modularLluviaAgua(lectura);

  String valor = obtenerGiroscopio();
  lectura = lectura + valor;

  Serial.println(lectura);

  if (valorT == "H999-T999-I999"){
    avisoError(1);
  } else if (valor == "-D999"){
    avisoError(2);
  } else {
    avisoError(0);
  }

  delay(100);
}

// --- NUEVA FUNCIÓN: LECTURA DEL MPU6050 --- PROBARRRR
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