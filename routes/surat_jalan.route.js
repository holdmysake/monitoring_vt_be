import express from "express"
import ExcelJS from "exceljs"
import SuratJalan from "../models/surat_jalan.model.js"
import PersonelSuratJalan from "../models/personel_surat_jalan.model.js"
import TripSuratJalan from "../models/trip_surat_jalan.model.js"
import PersonelTrip from "../models/personel_trip.model.js"
import User from "../models/user.model.js"
import sequelize from "../db.js"
import moment from "moment-timezone"
import { col, fn, literal, Op } from "sequelize"
import VT from "../models/vt.model.js"
import QRCode from "qrcode"
import qrcode from "qrcode-terminal"
import Personel from "../models/personel.model.js"
import Rute from "../models/rute.model.js"
import fs, { writeFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { PDFDocument, rgb } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import { verifyToken } from "../middlewares/user.middleware.js"
import RevisiTrip from "../models/revisi_trip.model.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

function drawTextAuto(page, font, text, { x, y, w }, size = 11) {
    let drawX = x

    if (w) {
        const textWidth = font.widthOfTextAtSize(text, size)
        drawX = x + (w - textWidth) / 2
    }

    page.drawText(text, {
        x: drawX,
        y,
        size,
        font,
        color: rgb(0, 0, 0)
    })
}

const fields = {
    no_sj:           { x: 312, y: 676 },
    date:            { x: 312, y: 662 },
    rute:            { x: 312, y: 648 },

    driver1:         { x: 312, y: 594.5 },
    helper1:         { x: 312, y: 581 },
    driver2:         { x: 312, y: 554 },
    helper2:         { x: 312, y: 540.5 },

    no_vt:           { x: 312, y: 526.5 },
    plat:            { x: 312, y: 512.5 },
    kapasitas:       { x: 312, y: 498.5 },
    bbm:             { x: 312, y: 485 },
    time_out:        { x: 312, y: 470.5 },
    time_back:       { x: 312, y: 457 },

    driver1_ttd:     { x: 88,  y: 273.5, w: 111 },
    driver2_ttd:     { x: 194.5, y: 273.5, w: 111 },
    dispatcher:      { x: 414, y: 273.5, w: 111 },

    qr:              { x: 90, y: 105 },
    dispathcer_sign: { x: 430, y: 285 },
}

router.post("/create", verifyToken, async (req, res) => {
    try {
        const { 
            rute_id, supervisor_id, dispatcher_id, date, vt_id,
            driver1, driver2, helper1, helper2,
            bbm, time_out, time_back
        } = req.body

        const start = moment().startOf("year").format("YYYY-MM-DD")
        const end   = moment().endOf("year").format("YYYY-MM-DD")
        const year = moment(start).format("YYYY")

        const last_sj = await SuratJalan.findOne({
            where: {
                date: {
                    [Op.between]: [start, end]
                }
            },
            order: [['id', 'DESC']]
        })
        let sj_count = 1
        if (last_sj) {
            const last_no_sj = last_sj.no_surat_jalan
            const last_count = parseInt(last_no_sj.split("/").pop())
            if (!isNaN(last_count)) {
                sj_count = last_count + 1
            }
        }

        const vt = await VT.findOne({ where: { vt_id } })
        const surat_jalan_id = `SJ-${Math.random().toString(36).substring(2, 19).toUpperCase()}`

        const qr = { surat_jalan_id }
        const qrString = JSON.stringify(qr)
        const qrImage = await QRCode.toDataURL(qrString)

        const no_vt = vt.no_vt.replace(/\s/g, '')

        const new_surat_jalan = await SuratJalan.create({
            surat_jalan_id,
            no_surat_jalan: `SJ-VT/${no_vt}/${year}/${sj_count}`,
            qr: qrImage,
            rute_id,
            supervisor_id,
            dispatcher_id,
            vt_id,
            date,
            bbm,
            time_out,
            time_back
        })

        if (new_surat_jalan) {
            const roles = [
                { id: driver1, role: "driver1" },
                { id: driver2, role: "driver2" },
                { id: helper1, role: "helper1" },
                { id: helper2, role: "helper2" }
            ]

            const filtered = roles.filter(r => r.id)

            for (const r of filtered) {
                await PersonelSuratJalan.create({
                    surat_jalan_id: new_surat_jalan.surat_jalan_id,
                    personel_id: r.id,
                    role: r.role
                })
            }
        }

        qrcode.generate(qrString, { small: true })
        console.log("QR Surat Jalan:", surat_jalan_id)

        try {
            const sj = await SuratJalan.findOne({
                where: { surat_jalan_id: new_surat_jalan.surat_jalan_id },
                include: [
                    {
                        model: Rute,
                        as: "rute",
                        attributes: ["nama_rute"]
                    },
                    {
                        model: PersonelSuratJalan,
                        as: "personel_surat_jalan",
                        include: {
                            model: Personel,
                            as: "personel",
                            attributes: ["nama_personel"]
                        }
                    },
                    {
                        model: VT,
                        as: "vt"
                    },
                    {
                        model: User,
                        as: "dispatcher",
                        attributes: ["nama", "sign"]
                    }
                ]
            })

            const templatePath = path.join(__dirname, "../data/template_sj.pdf")
            const pdfBytes = fs.readFileSync(templatePath)
            const pdfDoc = await PDFDocument.load(pdfBytes)

            pdfDoc.registerFontkit(fontkit)

            const page = pdfDoc.getPages()[0]

            const calibriBytes = fs.readFileSync(
                path.join(__dirname, "../fonts/calibri-regular.ttf")
            )
            const font = await pdfDoc.embedFont(calibriBytes)

            const format = (n) => n ? new Intl.NumberFormat("id-ID").format(n) : ""
            const formatTime = (t) => t ? moment(t, "HH:mm:ss").format("HH:mm") : ""

            drawTextAuto(page, font, sj.no_surat_jalan, fields.no_sj)
            drawTextAuto(page, font, moment(sj.date).format("DD-MM-YYYY"), fields.date)
            drawTextAuto(page, font, sj.rute?.nama_rute, fields.rute)

            drawTextAuto(
                page,
                font,
                sj.personel_surat_jalan.find(p => p.role === "driver1")?.personel?.nama_personel,
                fields.driver1
            )

            drawTextAuto(
                page,
                font,
                sj.personel_surat_jalan.find(p => p.role === "helper1")?.personel?.nama_personel,
                fields.helper1
            )

            drawTextAuto(
                page,
                font,
                sj.personel_surat_jalan.find(p => p.role === "driver2")?.personel?.nama_personel,
                fields.driver2
            )

            drawTextAuto(
                page,
                font,
                sj.personel_surat_jalan.find(p => p.role === "helper2")?.personel?.nama_personel,
                fields.helper2
            )

            drawTextAuto(page, font, sj.vt?.no_vt, fields.no_vt)
            drawTextAuto(page, font, sj.vt?.plat, fields.plat)
            drawTextAuto(page, font, sj.vt?.kapasitas ? `${format(sj.vt.kapasitas)} L` : "", fields.kapasitas)
            drawTextAuto(page, font, sj.bbm ? `${format(sj.bbm)} L` : "", fields.bbm)
            drawTextAuto(page, font, sj.time_out ? `${moment(sj.time_out).format("DD-MM-YYYY HH:mm")}` : "", fields.time_out)
            drawTextAuto(page, font, sj.time_back ? `${moment(sj.time_back).format("DD-MM-YYYY HH:mm")}` : "", fields.time_back)

            drawTextAuto(
                page,
                font,
                sj.personel_surat_jalan.find(p => p.role === "driver1")?.personel?.nama_personel,
                fields.driver1_ttd
            )

            drawTextAuto(
                page,
                font,
                sj.personel_surat_jalan.find(p => p.role === "driver2")?.personel?.nama_personel,
                fields.driver2_ttd
            )

            drawTextAuto(
                page,
                font,
                sj.dispatcher?.nama,
                fields.dispatcher
            )

            const qrBase64 = sj.qr.replace(/^data:image\/png;base64,/, "")
            const qrBytes = Buffer.from(qrBase64, "base64")
            const qrImage = await pdfDoc.embedPng(qrBytes)

            page.drawImage(qrImage, {
                x: fields.qr.x,
                y: fields.qr.y,
                width: 120,
                height: 120
            })

            // Embed dispatcher sign
            if (sj.dispatcher?.sign) {
                const dispatcherSignPath = path.join(__dirname, "..", sj.dispatcher.sign)
                const dispatcherSignBytes = fs.readFileSync(dispatcherSignPath)

                // Check if the file is PNG or JPG
                const isPng = dispatcherSignPath.endsWith(".png")
                const dispatcherSignImage = isPng
                    ? await pdfDoc.embedPng(dispatcherSignBytes)
                    : await pdfDoc.embedJpg(dispatcherSignBytes)

                const signDims = dispatcherSignImage.scale(1)
                const signWidth = 80
                const signHeight = (signDims.height / signDims.width) * signWidth

                page.drawImage(dispatcherSignImage, {
                    x: fields.dispathcer_sign.x,
                    y: fields.dispathcer_sign.y,
                    width: signWidth,
                    height: signHeight
                })
            }

            const out = await pdfDoc.save()

            const outputDir = path.join(__dirname, "../uploads/sj")
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true })
            }

            const filePath = path.join(
                outputDir,
                `${new_surat_jalan.surat_jalan_id}.pdf`
            )

            fs.writeFileSync(filePath, out)
        } catch (e) {
            const errorLogPath = path.join(__dirname, "../uploads/sj/log_error.txt")
            writeFileSync(errorLogPath, JSON.stringify(e, null, 2))
        
            console.error("DOCX ERROR (saved to file):", errorLogPath)
        }        

        res.json({
            success: true,
            message: "Surat Jalan berhasil ditambahkan"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

const getSuratJalanOne = async (where) => {
    return await SuratJalan.findOne({
        where: where,
        include: [
            {
                model: VT,
                as: 'vt'
            },
            {
                model: Rute,
                as: 'rute'
            },
            {
                model: User,
                as: 'supervisor'
            },
            {
                model: PersonelSuratJalan,
                as: 'personel_surat_jalan',
                include: {
                    model: Personel,
                    as: 'personel'
                }
            },
            {
                model: TripSuratJalan,
                as: 'trip_surat_jalan',
                include: [
                    {
                        model: PersonelTrip,
                        as: 'personel_trip',
                        include: [
                            {
                                model: Personel,
                                as: 'personel'
                            },
                            {
                                model: User,
                                as: 'user'
                            }
                        ]
                    },
                    {
                        model: Rute,
                        as: 'rute'
                    },
                    {
                        model: RevisiTrip,
                        as: 'revisi_trips'
                    }
                ]
            }
        ],
        order: [['date', 'ASC']]
    })
}

const getSuratJalanAll = async (where) => {
    return await SuratJalan.findAll({
        where: where,
        include: [
            {
                model: VT,
                as: 'vt'
            },
            {
                model: Rute,
                as: 'rute'
            },
            {
                model: User,
                as: 'supervisor'
            },
            {
                model: PersonelSuratJalan,
                as: 'personel_surat_jalan',
                include: {
                    model: Personel,
                    as: 'personel'
                }
            },
            {
                model: TripSuratJalan,
                as: 'trip_surat_jalan',
                include: [
                    {
                        model: PersonelTrip,
                        as: 'personel_trip',
                        include: [
                            {
                                model: Personel,
                                as: 'personel'
                            },
                            {
                                model: User,
                                as: 'user'
                            }
                        ]
                    },
                    {
                        model: Rute,
                        as: 'rute'
                    },
                    {
                        model: RevisiTrip,
                        as: 'revisi_trips'
                    }
                ]
            }
        ],
        order: [['date', 'ASC']]
    })
}

router.post("/update", verifyToken, async (req, res) => {
    try {
        const { 
            surat_jalan_id,
            rute_id, supervisor_id, dispatcher_id, date, vt_id,
            driver1, driver2, helper1, helper2,
            bbm, time_out, time_back
        } = req.body

        const surat_jalan = await SuratJalan.findOne({ where: { surat_jalan_id } })

        if (surat_jalan.trip_surat_jalan && surat_jalan.trip_surat_jalan.length > 0) {
            return res.status(400).json({ message: "Surat Jalan memiliki trip terkait, tidak dapat diperbarui" })
        }

        if (!surat_jalan) {
            return res.status(404).json({ message: "Surat Jalan tidak ditemukan" })
        }

        await surat_jalan.update({
            rute_id, supervisor_id, dispatcher_id, date, vt_id,
            bbm, time_out, time_back
        })

        const personel_surat_jalan = await PersonelSuratJalan.findAll({ where: { surat_jalan_id } })
        for (const p of personel_surat_jalan) {
            if (p.role === "driver1") {
                p.personel_id = driver1
            } else if (p.role === "driver2") {
                p.personel_id = driver2
            } else if (p.role === "helper1") {
                p.personel_id = helper1
            } else if (p.role === "helper2") {
                p.personel_id = helper2
            }
            await p.save()
        }

        res.json({
            success: true,
            message: "Surat Jalan berhasil diperbarui"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/delete", verifyToken, async (req, res) => {
    try {
        const { surat_jalan_id } = req.body

        const surat_jalan = await SuratJalan.findOne({ where: { surat_jalan_id } })

        if (!surat_jalan) {
            return res.status(404).json({ message: "Surat Jalan tidak ditemukan" })
        }

        await surat_jalan.destroy()

        res.json({
            success: true,
            message: "Surat Jalan berhasil dihapus"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/get", verifyToken, async (req, res) => {
    try {
        const { surat_jalan_id } = req.body

        const surat_jalan = await getSuratJalanOne({ surat_jalan_id })

        res.json({
            success: true,
            message: "Surat Jalan berhasil diambil",
            surat_jalan
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/getSJByDates", verifyToken, async (req, res) => {
    try {
        const { dates = [] } = req.body

        if (!Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({ message: "Tanggal tidak valid" })
        }

        if (dates.length === 1) {
            dates[1] = dates[0]
        }

        const startDate = moment(dates[0], "YYYY-MM-DD").startOf("day").toDate()
        const endDate = moment(dates[1], "YYYY-MM-DD").endOf("day").toDate()

        const surat_jalans = await getSuratJalanAll({
            date: {
                [Op.gte]: startDate,
                [Op.lte]: endDate
            }
        })

        res.json({
            success: true,
            message: "Surat Jalan berhasil diambil",
            surat_jalans
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/getSJBySupervisor", verifyToken, async (req, res) => {
    try {
        const { supervisor_id, date } = req.body

        const surat_jalans = await getSuratJalanAll({
            supervisor_id,
            date
        })

        res.json({
            success: true,
            message: "Surat Jalan berhasil diambil",
            surat_jalans
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/getSJByRute", verifyToken, async (req, res) => {
    try {
        const { rute_id, date } = req.body

        const surat_jalans = await getSuratJalanAll({
            rute_id,
            date
        })

        res.json({
            success: true,
            message: "Surat Jalan berhasil diambil",
            surat_jalans
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/getDatesWithRevisi", async (req, res) => {
    try {
        const { supervisor_id } = req.body

        const revisi_trips = await SuratJalan.findAll({
            attributes: [
                'date',
                [fn('COUNT', col('trip_surat_jalan.revisi_trips.revisi_id')), 'total_revisi'],
                [fn('COUNT', literal('DISTINCT surat_jalan.surat_jalan_id')), 'total_surat_jalan']
            ],
            include: [
                {
                    model: TripSuratJalan,
                    as: 'trip_surat_jalan',
                    attributes: [],
                    required: true,
                    include: [
                        {
                            model: RevisiTrip,
                            as: 'revisi_trips',
                            attributes: [],
                            required: true
                        }
                    ]
                }
            ],
            where: { supervisor_id },
            group: ['surat_jalan.date'],
            order: [['date', 'DESC']],
            raw: true
        })

        res.json({
            success: true,
            message: "Tanggal dengan revisi trip berhasil diambil",
            revisi_trips
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/trip", verifyToken, async (req, res) => {
    const t = await sequelize.transaction()

    try {
        const { 
            trip_id, surat_jalan_id, rute_id,
            gross_loading, net_loading,
            gross_unloading, net_unloading,
            jam_loading, jam_unloading, no_segel,
            driver, helper, op_loading, op_unloading
        } = req.body

        let trip = null

        if (trip_id) {
            trip = await TripSuratJalan.findOne({ 
                where: { trip_id },
                transaction: t
            })
        }

        const operatorId = op_loading || op_unloading
        if (operatorId) {
            const opUser = await User.findOne({ 
                where: { user_id: operatorId },
                transaction: t
            })

            if (!opUser) {
                await t.rollback()
                return res.status(400).json({ message: "Operator tidak ditemukan di sistem pengguna" })
            }
            if (opUser.jabatan !== "operator") {
                await t.rollback()
                return res.status(400).json({ message: "User bukan operator" })
            }
        }

        let newTripId = null

        if (!trip) {
            newTripId = `T-${Math.random().toString(36).substring(2, 20).toUpperCase()}`

            await TripSuratJalan.create({
                trip_id: newTripId,
                surat_jalan_id,
                rute_id,
                gross_loading,
                net_loading,
                jam_loading,
                no_segel
            }, { transaction: t })

            const roles = [
                { id: driver, role: "driver" },
                { id: helper, role: "helper" }
            ].filter(p => p.id)

            for (const p of roles) {
                await PersonelTrip.create({
                    trip_id: newTripId,
                    personel_id: p.id,
                    role: p.role
                }, { transaction: t })
            }

            await PersonelTrip.create({
                trip_id: newTripId,
                user_id: operatorId,
                role: "op_loading"
            }, { transaction: t })
        } else {
            trip.gross_unloading = gross_unloading
            trip.net_unloading = net_unloading
            trip.jam_unloading = jam_unloading

            await trip.save({ transaction: t })

            if (op_unloading) {
                await PersonelTrip.create({
                    trip_id: trip.trip_id,
                    user_id: op_unloading,
                    role: "op_unloading"
                }, { transaction: t })
            }
        }

        const targetTripId = trip_id || newTripId

        const trip_response = await TripSuratJalan.findOne({
            where: { trip_id: targetTripId },
            include: [
                {
                    model: PersonelTrip,
                    as: 'personel_trip',
                    include: {
                        model: Personel,
                        as: 'personel'
                    }
                },
                {
                    model: Rute,
                    as: 'rute'
                }
            ],
            transaction: t
        })

        await t.commit()

        res.json({
            success: true,
            message: "Trip berhasil diproses",
            trip: trip_response
        })

    } catch (error) {
        console.error(error)
        await t.rollback()
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/updateTrip", verifyToken, async (req, res) => {
    try {
        const {
            trip_id,
            gross_loading, net_loading,
            gross_unloading, net_unloading
        } = req.body

        const trip = await TripSuratJalan.findOne({ where: { trip_id } })

        if (!trip) {
            return res.status(404).json({ message: "Trip tidak ditemukan" })
        }

        trip.gross_loading = gross_loading
        trip.net_loading = net_loading
        trip.gross_unloading = gross_unloading
        trip.net_unloading = net_unloading

        await trip.save()

        res.json({
            success: true,
            message: "Trip berhasil diperbarui",
            trip
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/createRevisiTrip", verifyToken, async (req, res) => {
    try {
        const {
            trip_id, gross_volume, net_volume, is_loading_trip, reason_revisi
        } = req.body

        const revisi_id = `RT-${Math.random().toString(36).substring(2, 14).toUpperCase()}`

        const revisi_trip = await RevisiTrip.create({
            revisi_id,
            trip_id,
            gross_volume,
            net_volume,
            is_loading_trip,
            reason_revisi,
        })

        res.json({
            success: true,
            message: "Revisi Trip berhasil ditambahkan",
            revisi_trip
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/getRevisiTrips", verifyToken, async (req, res) => {
    try {
        const revisi_trips = await RevisiTrip.findAll({
            include: [
                {
                    model: TripSuratJalan,
                    as: 'trip'
                },
                {
                    model: User,
                    as: 'supervisor'
                },
                {
                    model: Personel,
                    as: 'operator'
                }
            ],
            order: [['createdAt', 'DESC']]
        })

        res.json({
            success: true,
            message: "Revisi Trip berhasil diambil",
            revisi_trips
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/acceptRevisiTrip", verifyToken, async (req, res) => {
    try {
        const { revisi_id, gross_volume, net_volume, is_loading_trip } = req.body

        const revisi_trip = await RevisiTrip.findOne({ where: { revisi_id } })

        if (!revisi_trip) {
            return res.status(404).json({ message: "Revisi Trip tidak ditemukan" })
        }

        const trip = await TripSuratJalan.findOne({ where: { trip_id: revisi_trip.trip_id } })

        if (!trip) {
            return res.status(404).json({ message: "Trip tidak ditemukan" })
        }

        if (is_loading_trip) {
            trip.gross_loading = gross_volume
            trip.net_loading = net_volume
        } else {
            trip.gross_unloading = gross_volume
            trip.net_unloading = net_volume
        }

        await trip.save()
        await revisi_trip.destroy()

        res.json({
            success: true,
            message: "Revisi Trip berhasil diterima dan dihapus"
        })
    } catch (error) {   
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/rejectRevisiTrip", verifyToken, async (req, res) => {
    try {
        const { revisi_id } = req.body

        const revisi_trip = await RevisiTrip.findOne({ where: { revisi_id } })

        if (!revisi_trip) {
            return res.status(404).json({ message: "Revisi Trip tidak ditemukan" })
        }

        await revisi_trip.destroy()

        res.json({
            success: true,
            message: "Revisi Trip berhasil ditolak dan dihapus"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

router.post("/downloadExcel", verifyToken, async (req, res) => {
    try {
        const { dates = [] } = req.body

        if (!Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({ message: "Tanggal tidak valid" })
        }

        const dateConditions = dates.map(d => ({
            [Op.between]: [
                moment(d, "YYYY-MM-DD").startOf("day").toDate(),
                moment(d, "YYYY-MM-DD").endOf("day").toDate()
            ]
        }))

        const surat_jalans = await getSuratJalanAll({
            date: {
                [Op.or]: dateConditions
            }
        })

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Surat Jalan')

        worksheet.columns = [
            { header: 'Tanggal', key: 'date', width: 15 },
            { header: 'Kendaraan', key: 'kendaraan', width: 25 },
            { header: 'No Surat Jalan', key: 'no_surat_jalan', width: 25 },
            { header: 'Rute SJ', key: 'rute_sj', width: 25 },
            { header: 'BBM', key: 'bbm', width: 15 },
            { header: 'Time Out', key: 'time_out', width: 20 },
            { header: 'Time Back', key: 'time_back', width: 20 },
            { header: 'Driver 1', key: 'driver1', width: 20 },
            { header: 'Driver 2', key: 'driver2', width: 20 },
            { header: 'Helper 1', key: 'helper1', width: 20 },
            { header: 'Helper 2', key: 'helper2', width: 20 },
            { header: 'Supervisor', key: 'supervisor', width: 20 },
            { header: 'Trip ID', key: 'trip_id', width: 20 },
            { header: 'Rute Trip', key: 'rute_trip', width: 25 },
            { header: 'No Segel', key: 'no_segel', width: 15 },
            { header: 'Gross Load', key: 'gross_load', width: 15 },
            { header: 'Net Load', key: 'net_load', width: 15 },
            { header: 'Gross Unload', key: 'gross_unload', width: 15 },
            { header: 'Net Unload', key: 'net_unload', width: 15 },
            { header: 'Driver Trip', key: 'driver_trip', width: 20 },
            { header: 'Helper Trip', key: 'helper_trip', width: 20 },
            { header: 'Op Loading', key: 'op_loading', width: 20 },
            { header: 'Op Unloading', key: 'op_unloading', width: 20 }
        ]

        const groupedByDate = {}
        surat_jalans.forEach(sj => {
            const dateKey = moment(sj.date).format("DD-MM-YYYY")
            if (!groupedByDate[dateKey]) groupedByDate[dateKey] = {}
            const vehicleKey = sj.vt ? `${sj.vt.no_vt} (${sj.vt.plat}) - Kapasitas: ${sj.vt.kapasitas}` : 'Tanpa Kendaraan'
            if (!groupedByDate[dateKey][vehicleKey]) groupedByDate[dateKey][vehicleKey] = []
            groupedByDate[dateKey][vehicleKey].push(sj)
        })

        for (const [date, vehicles] of Object.entries(groupedByDate)) {
            let datePrinted = false;

            for (const [vehicle, sjs] of Object.entries(vehicles)) {
                let vehiclePrinted = false;

                sjs.forEach(sj => {
                    let sjPrinted = false;

                    const driver1 = sj.personel_surat_jalan?.find(p => p.role === 'driver1')?.personel?.nama_personel || ''
                    const driver2 = sj.personel_surat_jalan?.find(p => p.role === 'driver2')?.personel?.nama_personel || ''
                    const helper1 = sj.personel_surat_jalan?.find(p => p.role === 'helper1')?.personel?.nama_personel || ''
                    const helper2 = sj.personel_surat_jalan?.find(p => p.role === 'helper2')?.personel?.nama_personel || ''

                    const baseSjData = {
                        no_surat_jalan: sj.no_surat_jalan,
                        rute_sj: sj.rute?.nama_rute || '',
                        bbm: sj.bbm || 0,
                        time_out: sj.time_out ? moment(sj.time_out).format('DD-MM-YYYY HH:mm') : '',
                        time_back: sj.time_back ? moment(sj.time_back).format('DD-MM-YYYY HH:mm') : '',
                        driver1,
                        driver2,
                        helper1,
                        helper2,
                        supervisor: sj.supervisor?.nama || ''
                    }

                    if (sj.trip_surat_jalan && sj.trip_surat_jalan.length > 0) {
                        sj.trip_surat_jalan.forEach(trip => {
                            const driverTrip = trip.personel_trip?.find(p => p.role === 'driver')?.personel?.nama_personel || ''
                            const helperTrip = trip.personel_trip?.find(p => p.role === 'helper')?.personel?.nama_personel || ''
                            const opLoading = trip.personel_trip?.find(p => p.role === 'op_loading')?.user?.nama || ''
                            const opUnloading = trip.personel_trip?.find(p => p.role === 'op_unloading')?.user?.nama || ''

                            worksheet.addRow({
                                date: !datePrinted ? date : '',
                                kendaraan: !vehiclePrinted ? vehicle : '',
                                ...( !sjPrinted ? baseSjData : {
                                    no_surat_jalan: '', rute_sj: '', bbm: '', time_out: '', time_back: '',
                                    driver1: '', driver2: '', helper1: '', helper2: '', supervisor: ''
                                } ),
                                trip_id: trip.trip_id,
                                rute_trip: trip.rute?.nama_rute || '',
                                no_segel: trip.no_segel || '',
                                gross_load: trip.gross_loading || 0,
                                net_load: trip.net_loading || 0,
                                gross_unload: trip.gross_unloading || 0,
                                net_unload: trip.net_unloading || 0,
                                driver_trip: driverTrip,
                                helper_trip: helperTrip,
                                op_loading: opLoading,
                                op_unloading: opUnloading
                            })

                            sjPrinted = true;
                            datePrinted = true;
                            vehiclePrinted = true;
                        })
                    } else {
                        worksheet.addRow({
                            date: !datePrinted ? date : '',
                            kendaraan: !vehiclePrinted ? vehicle : '',
                            ...baseSjData,
                            trip_id: '',
                            rute_trip: '',
                            no_segel: '',
                            gross_load: '',
                            net_load: '',
                            gross_unload: '',
                            net_unload: '',
                            driver_trip: '',
                            helper_trip: '',
                            op_loading: '',
                            op_unloading: ''
                        })

                        sjPrinted = true;
                        datePrinted = true;
                        vehiclePrinted = true;
                    }
                })
            }
        }

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=Surat_Jalan.xlsx'
        )

        await workbook.xlsx.write(res)
        res.end()

    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false,
            message: error.message
        })
    }
})

export default router