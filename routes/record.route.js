import Record from "../models/record.model.js"

export const recordMQTT = async (payload) => {
    try {
        const newRecord = await Record.create({
            vt_id: payload.vt_id,
            lat: payload.lat,
            lng: payload.lng,
            speed: payload.speed,
            alt: payload.alt,
            dir: payload.dir,
            sat: payload.sat
        })
        console.log("📥 New Record Saved:", newRecord.toJSON())
    } catch (error) {
        console.error("Error saving record:", error)
    }
}