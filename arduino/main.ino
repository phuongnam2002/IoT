#define Log(X) Serial.println(">> " + String(X))

#define dhtPort             2
#define led1Port            12 //D6
#define led2Port            13 //D7
#define photoPort           A0 // 32
#define dhtType             DHT11

/************************* WiFi Access Point *********************************/
#define wifi_username       "Nam Nam Nam"
#define wifi_password       "20051979"

/************************* MQTT Setup *********************************/
#define MQTT_SERVER         "192.168.43.73"
#define MQTT_SERVERPORT     1883
#define MQTT_SENSOR_TOPIC   "vstd/sensor"
#define MQTT_LED1_TOPIC     "vstd/led1"
#define MQTT_LED2_TOPIC     "vstd/led2"

#include "DHT.h"
#include <Arduino_DebugUtils.h>
#include <NTPClient.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoMqttClient.h>
#include <ArduinoJson.h>

WiFiClient wifi; 
MqttClient mqttClient(wifi); 
DHT dht(dhtPort, dhtType); 

WiFiUDP ntpUDP; 
NTPClient timeClient(ntpUDP);
int lastMs = millis();

void setup() {
  Serial.begin(9600);
  Debug.timestampOn();
  pinMode(led1Port, OUTPUT); 
  pinMode(led2Port, OUTPUT);

  connectWifi();
  connectMqtt();
  
  timeClient.begin();
  dht.begin();
  randomSeed(analogRead(0));
  mqttClient.onMessage(onMqttMessage);
  mqttClient.subscribe(MQTT_LED1_TOPIC);
  mqttClient.subscribe(MQTT_LED2_TOPIC);
}

void onMqttMessage() {
  String topic = mqttClient.messageTopic();
  DEBUG_INFO("New message: topic=%s", topic);
  String message = "";
  while (mqttClient.available()) {
    char c = mqttClient.read();
    message += String(c);
  }
  DEBUG_INFO("%s", message);
  if (topic == MQTT_LED1_TOPIC) {
    setLed(1, message == "true" ? true : false);
  } else if (topic == MQTT_LED2_TOPIC) {
    setLed(2, message == "true" ? true : false);
  }
}

void setLed(int which, bool enable) {
  if (enable) {
    digitalWrite(which == 1 ? led1Port : led2Port, HIGH);
  } else {
    digitalWrite(which == 1 ? led1Port : led2Port, LOW);
  }
}

void connectWifi() {
  WiFi.begin(wifi_username, wifi_password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  Serial.println();
  DEBUG_INFO("Wifi Connected! as %s", WiFi.localIP().toString());
}

void connectMqtt() {
  if (!mqttClient.connect(MQTT_SERVER, MQTT_SERVERPORT)) {
    DEBUG_ERROR("MQTT connection failed! Error code = %d", mqttClient.connectError());
    return;
  }
  DEBUG_INFO("MQTT Connected!");
}

void loop() {
  mqttClient.poll(); // kiểm tra và xử lý liên tục các tin nhắn từ MQTT
  timeClient.update();
  readDht();
}

void readDht() {
  if (millis() - lastMs >= 1000) {
    lastMs = millis();
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    float lux = analogRead(photoPort);

    mqttClient.beginMessage(MQTT_SENSOR_TOPIC);
    mqttClient.print(jsonify(humidity, temperature, lux, timeClient.getEpochTime())); 
    mqttClient.endMessage();
  }
}

char* jsonify(float humid, float temp, float lux, int time) {
  DynamicJsonDocument doc(1024);
  doc["humid"] = humid;
  doc["temp"] = temp;
  doc["lux"] = lux;
  doc["dust"] = random(101);
  doc["seconds"] = time;
  
  char* json = new char[256];
  serializeJson(doc, json, 256);

  return json;
}