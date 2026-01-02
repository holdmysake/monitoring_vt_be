import express from "express"
import Rute from "../models/rute.model.js"
import { verifyToken } from "../middlewares/user.middleware.js"

const router = express.Router()

router.post("/create", verifyToken, async (req, res) => {
    try {
        const { nama, jarak, user_id } = req.body

        const new_rute = await Rute.create({
            rute_id: `RUTE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            nama_rute: nama,
            jarak,
            user_id
        })

        res.json({
            message: "Rute berhasil ditambahkan",
            rute: new_rute
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/get", verifyToken, async (req, res) => {
    try {
        const rutes = await Rute.findAll()

        res.json({
            message: "Berhasil mengambil data rute",
            rutes
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

export default router