//https://programarfacil.com/blog/arduino-blog/instalar-una-libreria-de-arduino/
//https://programarfacil.com/blog/arduino-blog/sensor-dht11-temperatura-humedad-arduino/

#include <DHT.h>
 
#define DHTPIN 6

#define DHTTYPE DHT11
 
DHT dht(DHTPIN, DHTTYPE);
 
void setup() {
  // Inicializamos comunicación serie
  Serial.begin(9600);

  // Comenzamos el sensor DHT
  dht.begin();
 
}
 
void loop() {
    // Esperamos 5 segundos entre medidas
  delay(5000);
 
  // Leemos la humedad relativa
  float h = dht.readHumidity();
  // Leemos la temperatura en grados centígrados (por defecto)
  float t = dht.readTemperature();
 
  // Comprobamos si ha habido algún error en la lectura
  if (isnan(h) || isnan(t)) {
    Serial.println("Error obteniendo los datos del sensor DHT11");
    return;
  }
 
  // Calcular el índice de calor en grados centígrados
  float hic = dht.computeHeatIndex(t, h, false);
 
  Serial.print("H");
  Serial.print(h);
  Serial.print("-");
  Serial.print("T");
  Serial.print(t);
  Serial.print("-");
  Serial.print("I");
  Serial.print(hic);
  Serial.println();
 
}