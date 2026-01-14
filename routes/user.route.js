import express from "express"
import User from "../models/user.model.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { Op } from "sequelize"
import { verifyToken } from "../middlewares/user.middleware.js"

const JWT_SECRET = process.env.JWT_SECRET

const router = express.Router()

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "Email/Username dan password wajib diisi" })
        }

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { username: email }
                ]
            },
            attributes: { include: ['password'] }
        })

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Password salah" })
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                jabatan: user.jabatan
            },
            JWT_SECRET,
            { expiresIn: "1d" }
        )

        const userData = user.toJSON()
        delete userData.password
        userData.token = token

        res.json({
            message: "Login berhasil",
            user: userData
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/create", verifyToken, async(req, res) => {
    try {
        const { username, nama, email, password, no_hp, role, jabatan } = req.body

        if (!role) {
            role = "user"
        }

        const bcryptPassword = await bcrypt.hash(password, 12)

        const new_user = await User.create({
            user_id: `USER-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            username,
            nama,
            email,
            password: bcryptPassword,
            no_hp,
            role,
            jabatan
        })

        res.json({
            message: "User berhasil ditambahkan",
            user: new_user
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/update", verifyToken, async (req, res) => {
    try {
        const { user_id, username, nama, email, no_hp, jabatan } = req.body

        const user = await User.findOne({ where: { user_id } })

        user.username = username
        user.nama = nama
        user.email = email
        user.no_hp = no_hp
        user.jabatan = jabatan
        await user.save()

        res.json({
            message: "User berhasil diupdate",
            user
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/delete", verifyToken, async (req, res) => {
    try {
        const { user_id } = req.body

        const user = await User.findOne({ where: { user_id } })

        await user.destroy()

        res.json({
            message: "User berhasil dihapus"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getByID", verifyToken, async (req, res) => {
    try {
        const { user_id } = req.body

        const user = await User.findOne({
            where: { user_id }
        })

        res.json({
            message: "Berhasil mengambil data user",
            user
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getLast", verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({
            order: [['id', 'DESC']]
        })

        res.json({
            message: "Berhasil mengambil data user terakhir",
            user
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getUser", verifyToken, async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                role: 'user'
            }
        })

        res.json({
            message: "Berhasil mengambil data user",
            users
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getDispatcher", verifyToken, async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                role: 'user',
                jabatan: 'dispatcher'
            }
        })

        res.json({
            message: "Berhasil mengambil data user",
            users
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getSupervisor", verifyToken, async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                role: 'user',
                jabatan: 'supervisor'
            }
        })

        res.json({
            message: "Berhasil mengambil data user",
            users
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

export default router