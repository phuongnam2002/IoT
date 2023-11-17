import org.eclipse.paho.client.mqttv3.MqttClient
import org.eclipse.paho.client.mqttv3.MqttMessage

const val BROKER = "tcp://192.168.43.73:1883"

class MqttCenter(onGetSensorData: (String) -> Unit) {
    private val client = MqttClient(BROKER, MqttClient.generateClientId())

    init {
        client.connect()
        println(">> MQTT connected=${client.isConnected}")
        subscribe(SENSOR_TOPIC, onGetSensorData)
    }

    fun toggleLed(which: Int, on: Boolean) {
        when (which) {
            1 -> publish(LED1_TOPIC, if (on) "true" else "false")
            2 -> publish(LED2_TOPIC, if (on) "true" else "false")
        }
    }

    private fun subscribe(topic: String, callback: (String) -> Unit) {
        client.subscribe(topic) { _, message ->
            callback(message.toString())
        }
    }

    private fun publish(topic: String, message: String) {
        client.publish(topic, MqttMessage(message.toByteArray()))
    }

    companion object {
        const val SENSOR_TOPIC = "vstd/sensor"
        const val LED1_TOPIC = "vstd/led1"
        const val LED2_TOPIC = "vstd/led2"
    }
}