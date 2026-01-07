import express from "express"
import multer from "multer"
import fs from "fs"
import path from "path"
import Personel from "../models/personel.model.js"
import { verifyToken } from "../middlewares/user.middleware.js"
import VT from "../models/vt.model.js"

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const field = file.fieldname
        let folder = `uploads/${field}`

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true })
        }

        cb(null, folder)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9)
        cb(null, unique + ext)
    }
})

function checkFile(req, file, cb) {
    const allowed = /jpg|jpeg|png|pdf/i
    const ext = path.extname(file.originalname)

    if (!allowed.test(ext)) {
        return cb(new Error("File harus berupa jpg, jpeg, png, atau pdf"))
    }

    cb(null, true)
}

const upload = multer({
    storage,
    fileFilter: checkFile
})

function deleteUploadedFiles(files) {
    if (!files) return

    Object.values(files).forEach(arr => {
        arr.forEach(file => {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path)
            }
        })
    })
}

function deleteFileIfExists(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
    }
}

router.post("/create", 
    verifyToken,
    upload.fields([
        { name: "foto", maxCount: 1 },
        { name: "ktp", maxCount: 1 },
        { name: "sim", maxCount: 1 },
        { name: "siml", maxCount: 1 }
    ]),
    async (req, res) => {
    try {
        const { nama_personel, no_hp, sim_expired_at, siml_expired_at, is_driver, def_helper, def_vt } = req.body

        let def_helper_dump = def_helper
        let def_vt_dump = def_vt

        if (!is_driver) {
            def_helper_dump = null
            def_vt_dump = null
        }

        const new_personel = await Personel.create({
            personel_id: `PSNL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            nama_personel,
            no_hp,
            foto: req.files.foto?.[0]?.path || null,
            ktp: req.files.ktp?.[0]?.path || null,
            sim: req.files.sim?.[0]?.path || null,
            siml: req.files.siml?.[0]?.path || null,
            sim_expired_at,
            siml_expired_at,
            is_driver,
            def_helper: def_helper_dump,
            def_vt: def_vt_dump
        })

        res.json({
            message: "Personel sukses ditambahkan",
            personel: new_personel
        })
    } catch (error) {
        console.error(error)
        deleteUploadedFiles(req.files)
        res.status(500).json({ message: error.message })
    }
})

router.post(
    "/update",
    verifyToken,
    upload.fields([
        { name: "foto", maxCount: 1 },
        { name: "ktp", maxCount: 1 },
        { name: "sim", maxCount: 1 },
        { name: "siml", maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const {
                personel_id,
                nama_personel,
                no_hp,
                sim_expired_at,
                siml_expired_at,
                is_driver,
                def_helper,
                def_vt
            } = req.body

            let def_helper_dump = def_helper
            let def_vt_dump = def_vt

            if (!is_driver) {
                def_helper_dump = null
                def_vt_dump = null
            }

            const personel = await Personel.findOne({ where: { personel_id } })

            if (req.body.foto === null || !req.body.ktp && personel.foto) {
                deleteFileIfExists(personel.foto)
                personel.foto = null
            }
            
            if ((req.body.ktp === null || !req.body.ktp) && personel.ktp) {
                deleteFileIfExists(personel.ktp)
                personel.ktp = null
            }
            
            if (req.body.sim === null || !req.body.ktp && personel.sim) {
                deleteFileIfExists(personel.sim)
                personel.sim = null
            }
            
            if (req.body.siml === null || !req.body.ktp && personel.siml) {
                deleteFileIfExists(personel.siml)
                personel.siml = null
            }

            if (!personel) {
                deleteUploadedFiles(req.files)
                return res.status(404).json({ message: "Personel tidak ditemukan" })
            }

            if (req.files.foto) {
                deleteFileIfExists(personel.foto)
                personel.foto = req.files.foto[0].path
            }

            if (req.files.ktp) {
                deleteFileIfExists(personel.ktp)
                personel.ktp = req.files.ktp[0].path
            }

            if (req.files.sim) {
                deleteFileIfExists(personel.sim)
                personel.sim = req.files.sim[0].path
            }

            if (req.files.siml) {
                deleteFileIfExists(personel.siml)
                personel.siml = req.files.siml[0].path
            }

            personel.nama_personel = nama_personel
            personel.no_hp = no_hp
            personel.sim_expired_at = sim_expired_at
            personel.siml_expired_at = siml_expired_at
            personel.is_driver = is_driver
            personel.def_helper = def_helper_dump
            personel.def_vt = def_vt_dump

            await personel.save()

            res.json({
                message: "Personel berhasil diperbarui",
                personel
            })
        } catch (error) {
            console.error(error)
            deleteUploadedFiles(req.files)
            res.status(500).json({ message: error.message })
        }
    }
)

router.post("/delete", verifyToken, async (req, res) => {
    try {
        const { personel_id } = req.body

        const personel = await Personel.findOne({ where: { personel_id } })

        if (!personel) {
            return res.status(404).json({ message: "Personel tidak ditemukan" })
        }

        deleteFileIfExists(personel.foto)
        deleteFileIfExists(personel.ktp)
        deleteFileIfExists(personel.sim)
        deleteFileIfExists(personel.siml)

        await personel.destroy()

        res.json({ message: "Personel berhasil dihapus" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getDrivers", verifyToken, async (req, res) => {
    try {
        const drivers = await Personel.findAll({
            where: {
                is_driver: 1
            },
            include: [
                {
                    model: Personel,
                    as: 'helper',
                    attributes: ['personel_id', 'nama_personel',]
                },
                {
                    model: VT,
                    as: 'vt',
                    attributes: ['vt_id', 'plat', 'no_vt']
                }
            ]
        })

        res.json({
            message: "Daftar driver berhasil diambil",
            drivers
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getDriverByID", verifyToken, async (req, res) => {
    try {
        const { personel_id } = req.body

        const driver = await Personel.findOne({
            where: {
                personel_id,
                is_driver: 1
            }
        })

        if (!driver) {
            return res.status(404).json({ message: "Driver tidak ditemukan" })
        }

        res.json({
            message: "Driver berhasil diambil",
            driver
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getLastDriver", verifyToken, async (req, res) => {
    try {
        const driver = await Personel.findOne({
            where: {
                is_driver: 1
            },
            order: [['id', 'DESC']]
        })

        res.json({
            message: 'Driver terakhir berhasil diambil',
            driver
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getDriverSJ", verifyToken, async (req, res) => {
    try {
        const drivers = await Personel.findAll({
            where: {
                is_driver: 1
            },
            attributes: ['personel_id', 'nama_personel', 'foto', 'sim_expired_at', 'siml_expired_at']
        })

        res.json({
            message: "Daftar driver untuk surat jalan berhasil diambil",
            drivers
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getHelpers", verifyToken, async (req, res) => {
    try {
        const helpers = await Personel.findAll({
            where: {
                is_driver: 0
            }
        })

        res.json({
            message: "Daftar helper berhasil diambil",
            helpers
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getHelperByID", verifyToken, async (req, res) => {
    try {
        const { personel_id } = req.body

        const helper = await Personel.findOne({
            where: {
                personel_id,
                is_driver: 0
            }
        })

        if (!helper) {
            return res.status(404).json({ message: "Helper tidak ditemukan" })
        }

        res.json({
            message: "Helper berhasil diambil",
            helper
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getLastHelper", verifyToken, async (req, res) => {
    try {
        const helper = await Personel.findOne({
            where: {
                is_driver: 0
            },
            order: [['id', 'DESC']]
        })

        res.json({
            message: 'Helper terakhir berhasil diambil',
            helper
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/getHelperSJ", verifyToken, async (req, res) => {
    try {
        const helpers = await Personel.findAll({
            where: {
                is_driver: 0
            },
            attributes: ['personel_id', 'nama_personel', 'foto', 'sim_expired_at', 'siml_expired_at']
        })

        res.json({
            message: "Daftar helper untuk surat jalan berhasil diambil",
            helpers
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

export default router