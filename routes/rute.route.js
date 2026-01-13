import express from "express"
import Rute from "../models/rute.model.js"
import { verifyToken } from "../middlewares/user.middleware.js"
import User from "../models/user.model.js"

const router = express.Router()

router.post("/create", verifyToken, async (req, res) => {
    try {
        const { nama, jarak, user_id, tipe_rute, buffer } = req.body

        const new_rute = await Rute.create({
            rute_id: `RUTE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            nama_rute: nama,
            jarak,
            user_id,
            tipe_rute,
            buffer
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

router.post("/update", verifyToken, async (req, res) => {
    try {
        const { rute_id, nama, jarak, user_id, tipe_rute, buffer } = req.body

        const rute = await Rute.findOne({ where: { rute_id } })

        if (!rute) {
            return res.status(404).json({ message: "Rute tidak ditemukan" })
        }

        rute.nama_rute = nama
        rute.jarak = jarak
        rute.user_id = user_id
        rute.tipe_rute = tipe_rute
        rute.buffer = buffer
        await rute.save()

        res.json({
            message: "Rute berhasil diperbarui",
            rute
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getByID", verifyToken, async (req, res) => {
    try {
        const { rute_id } = req.body

        const rute = await Rute.findOne({
            where: { rute_id },
            include: [{
                model: User,
                as: 'supervisor',
                attributes: ['user_id', 'nama']
            }]
        })

        if (!rute) {
            return res.status(404).json({ message: "Rute tidak ditemukan" })
        }

        res.json({
            message: "Berhasil mengambil data rute",
            rute
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getLastRute", verifyToken, async (req, res) => {
    try {
        const last_rute = await Rute.findOne({
            order: [['id', 'DESC']]
        })

        res.json({
            message: "Berhasil mengambil data rute terakhir",
            rute: last_rute
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/get", verifyToken, async (req, res) => {
    try {
        const rutes = await Rute.findAll({
            include: [{
                model: User,
                as: 'supervisor',
                attributes: ['user_id', 'nama']
            }]
        })

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