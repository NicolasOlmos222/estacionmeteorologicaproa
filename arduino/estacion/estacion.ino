#include <DHT.h>
#include <Wire.h>

#define DHT_PIN 6
#define LEDERROR_PIN 10  
#define RELE_PIN 7
#define LLUVIA_PIN 2
#define NIVELAGUA_PIN A0  
#define LUZ_PIN 12
#define PIN_BOTON 5
#define ANEMOMETRO_PIN 9 

#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

unsigned long tiempoAnteriorLed = 0; 
const long intervaloLed = 1000;  
int estadoLed = LOW;               
bool testON = false; 

// --- VARIABLES ANEMÓMETRO ---
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
  Wire.begin(); 
  
  pinMode(RELE_PIN, OUTPUT);
  pinMode(LLUVIA_PIN, INPUT);
  pinMode(LEDERROR_PIN, OUTPUT);
  pinMode(PIN_BOTON, INPUT);      
  pinMode(LUZ_PIN, INPUT);
  pinMode(ANEMOMETRO_PIN, INPUT); 

  digitalWrite(RELE_PIN, LOW);
  randomSeed(analogRead(A3)); 
}
 
void loop() {
  estadoActualAnemometro = digitalRead(ANEMOMETRO_PIN);
  if (estadoActualAnemometro == HIGH && estadoAnteriorAnemometro == LOW) {
    contadorVueltas++;
  }
  estadoAnteriorAnemometro = estadoActualAnemometro;

  unsigned long tiempoActual = millis();
  if (tiempoActual - tiempoAnteriorViento >= intervaloViento) {
    tiempoAnteriorViento = tiempoActual;
    unsigned long vueltas = contadorVueltas;
    contadorVueltas = 0; 
    velocidadVientoActual = vueltas * factorCalibracion;
  }

  if (!digitalRead(PIN_BOTON) == HIGH) {
    testON = !testON; 
    delay(500); 
  }

  if (Serial.available() > 0) {
    String comando = Serial.readString();
    comando.trim();
    if (comando == "R1") digitalWrite(RELE_PIN, HIGH);
    else if (comando == "R0") digitalWrite(RELE_PIN, LOW);
    else if (comando == "TEST1") testON = true;
    else if (comando == "TEST0") testON = false;
  }

  if (testON) {
      avisoError(3);
      TEST(); 
  } else {
      String lectura = obtenerTemperatura(); 
      lectura = modularLluviaAgua(lectura);   
      
      // Trama limpia sin dirección: Hxx-Txx-Ixx-Lxx-Axx-Vxx
      lectura = lectura + "-V" + String(velocidadVientoActual, 1);
      int valorLuz = analogRead(A1);
      lectura = lectura + "-Z" + String(valorLuz);
      Serial.println(lectura);

      if (lectura.startsWith("H999")) avisoError(1);
      else avisoError(0);
  }
}

void TEST(){
  // Removida la variable "-D"
  String prueba = "H" + String(random(20, 80)) + "-T" + String(random(15, 35)) + "-I" + String(random(15, 38));
  prueba = prueba + "-L" + String(random(0, 2));
  prueba = prueba + "-A" + String(random(0, 220));
  prueba = prueba + "-V" + String(random(0, 100));
  Serial.println(prueba);
}

String modularLluviaAgua(String stringBase) {
  int lluvia = (digitalRead(LLUVIA_PIN) == LOW) ? 1 : 0;
  int lecturaAnalogicaAgua = analogRead(NIVELAGUA_PIN);
  int volumenCC = map(lecturaAnalogicaAgua, 0, 1023, 0, 220);
  volumenCC = constrain(volumenCC, 0, 220);

  return stringBase + "-L" + String(lluvia) + "-A" + String(volumenCC);  
}

String obtenerTemperatura(){
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) return "H999-T999-I999";
  float hic = dht.computeHeatIndex(t, h, false);
  return "H" + String(h, 1) + "-T" + String(t, 1) + "-I" + String(hic, 1);
}

void avisoError(int error){
  if (error == 0) digitalWrite(LEDERROR_PIN, LOW);
  else if (error == 3) digitalWrite(LEDERROR_PIN, HIGH);
  else {
    unsigned long tiempoActual = millis();
    if (tiempoActual - tiempoAnteriorLed >= (error == 1 ? 1000 : 2000)) {
      tiempoAnteriorLed = tiempoActual;
      estadoLed = !estadoLed;
      digitalWrite(LEDERROR_PIN, estadoLed);
    }
  }
}