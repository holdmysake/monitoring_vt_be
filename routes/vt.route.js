import express from "express"
import VT from "../models/vt.model.js"
import { verifyToken } from "../middlewares/user.middleware.js"
import Personel from "../models/personel.model.js"

const router = express.Router()

router.post("/create", verifyToken, async (req, res) => {
    try {
        const { plat, no_vt, kapasitas } = req.body

        const new_vt = await VT.create({
            vt_id: `VT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            plat,
            no_vt,
            kapasitas
        })

        res.json({
            message: "VT berhasil ditambahkan",
            vt: new_vt
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/get", verifyToken, async (req, res) => {
    try {
        const vts = await VT.findAll({
            include: [
                {
                    model: Personel,
                    as: 'personels',
                    attributes: ['personel_id', 'nama_personel']
                }
            ]
        })

        res.json({
            message: "Berhasil mengambil data VT",
            vts
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

export default router