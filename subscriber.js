import mqtt from "mqtt"
import dotenv from "dotenv"
import { recordMQTT } from "./routes/record.route.js"

dotenv.config()

const mqttHost = process.env.DB_HOST
const mqttUrl = `mqtt://${mqttHost}:1883`

const client = mqtt.connect(mqttUrl)

client.on("connect", () => {
    console.log("MQTT Connected:", mqttUrl)

    client.subscribe("gps", (err) => {
        if (err) console.error("MQTT Subscribe Error:", err)
        else console.log("Subscribed to topic: gps")
    })
})

client.on("message", async (topic, message) => {
    try {
        const payload = JSON.parse(message.toString())

        const data = {
            vt_id: payload[0],
            lat: payload[1],
            lng: payload[2],
            speed: payload[3],
            alt: payload[4],
            dir: payload[5],
            sat: payload[6]
        }

        await recordMQTT(data)

        console.log("MQTT Message Received:", message.toString())

    } catch (err) {
        console.error("MQTT Message Error:", err)
    }
})

client.on("error", (err) => {
    console.error("MQTT Error:", err)
})

export default client