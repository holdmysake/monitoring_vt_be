import moment from "moment-timezone"
import Record from "../models/record.model.js"

export const recordMQTT = async (payload) => {
    try {
        const timestamp = new moment().format("YYYY-MM-DD HH:mm:ss")

        await Record.create({
            vt_id: payload.vt_id,
            lat: payload.lat,
            lng: payload.lng,
            speed: payload.speed,
            alt: payload.alt,
            dir: payload.dir,
            sat: payload.sat,
            timestamp
        })
    } catch (error) {
        console.error("Error saving record:", error)
    }
}