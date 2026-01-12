import express from "express"
import SuratJalan from "../models/surat_jalan.model.js"
import PersonelSuratJalan from "../models/personel_surat_jalan.model.js"
import TripSuratJalan from "../models/trip_surat_jalan.model.js"
import PersonelTrip from "../models/personel_trip.model.js"
import User from "../models/user.model.js"
import sequelize from "../db.js"
import moment from "moment-timezone"
import { Op } from "sequelize"
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
    no_sj:        { x: 306, y: 676 },
    date:         { x: 306, y: 662 },
    rute:         { x: 306, y: 648 },

    driver1:      { x: 306, y: 594.5 },
    helper1:      { x: 306, y: 581 },
    driver2:      { x: 306, y: 554 },
    helper2:      { x: 306, y: 540.5 },

    no_vt:        { x: 306, y: 526.5 },
    plat:         { x: 306, y: 512.5 },
    kapasitas:    { x: 306, y: 498.5 },
    bbm:          { x: 306, y: 485 },
    time_out:     { x: 306, y: 470.5 },
    time_back:    { x: 306, y: 457 },

    driver1_ttd:  { x: 82,  y: 273.5, w: 111 },
    driver2_ttd:  { x: 188.5, y: 273.5, w: 111 },
    dispatcher:   { x: 408, y: 273.5, w: 111 },

    qr:           { x: 90, y: 105 }
}

// router.post("/create-pdf-test", async (req, res) => {
//     try {
//         const { 
//             rute_id, supervisor_id, dispatcher_id, date, vt_id,
//             driver1, driver2, helper1, helper2,
//             bbm, time_out, time_back
//         } = req.body

//         if (!no_sj) {
//             return res.status(400).json({ message: "no_sj dibutuhkan" })
//         }

//         const templatePath = path.join(__dirname, "../data/template_sj1.pdf")
//         const pdfBytes = fs.readFileSync(templatePath)
//         const pdfDoc = await PDFDocument.load(pdfBytes)

//         pdfDoc.registerFontkit(fontkit)

//         const page = pdfDoc.getPages()[0]

//         const calibriBytes = fs.readFileSync(
//             path.join(__dirname, "../fonts/calibri-regular.ttf")
//         )
//         const font = await pdfDoc.embedFont(calibriBytes)

//         drawTextAuto(page, font, no_sj, fields.no_sj)
//         drawTextAuto(page, font, "20-12-2025", fields.date)
//         drawTextAuto(page, font, "RUTE A", fields.rute)

//         drawTextAuto(page, font, "Driver 1", fields.driver1_ttd)
//         drawTextAuto(page, font, "Driver 2", fields.driver2_ttd)
//         drawTextAuto(page, font, "Dispatcher", fields.dispatcher)

//         const qrPayload = { no_sj }
//         const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload))

//         const qrBase64 = qrDataUrl.replace(/^data:image\/pngbase64,/, "")
//         const qrBytes = Buffer.from(qrBase64, "base64")

//         const qrImage = await pdfDoc.embedPng(qrBytes)

//         page.drawImage(qrImage, {
//             x: fields.qr.x,
//             y: fields.qr.y,
//             width: 120,
//             height: 120
//         })

//         const out = await pdfDoc.save()

//         const outputDir = path.join(__dirname, "../uploads/sj")
//         if (!fs.existsSync(outputDir)) {
//             fs.mkdirSync(outputDir, { recursive: true })
//         }

//         const filePath = path.join(outputDir, `TEST_${no_sj}.pdf`)
//         fs.writeFileSync(filePath, out)

//         res.json({
//             message: "PDF test dibuat",
//             file: filePath
//         })
//     } catch (e) {
//         console.error(e)
//         res.status(500).json({ message: e.message })
//     }
// })

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

        const sj_count_raw = await SuratJalan.count({
            where: { date: { [Op.between]: [start, end] } }
        })
        const sj_count = String(sj_count_raw + 1).padStart(3, '0')

        const vt = await VT.findOne({ where: { vt_id } })
        const surat_jalan_id = `SJ-${Math.random().toString(36).substring(2, 19).toUpperCase()}`

        const qr = { surat_jalan_id }
        const qrString = JSON.stringify(qr)
        const qrImage = await QRCode.toDataURL(qrString)

        const new_surat_jalan = await SuratJalan.create({
            surat_jalan_id,
            no_surat_jalan: `SJ-VT/${vt.no_vt}/${year}/${sj_count}`,
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
                        attributes: ["nama"]
                    }
                ]
            })

            const templatePath = path.join(__dirname, "../data/template_sj1.pdf")
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
            drawTextAuto(page, font, sj.time_out ? `${formatTime(sj.time_out)} WIB` : "", fields.time_out)
            drawTextAuto(page, font, sj.time_back ? `${formatTime(sj.time_back)} WIB` : "", fields.time_back)

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
            message: "Surat Jalan berhasil ditambahkan"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

/*
router.post("/create", async (req, res) => {
    try {
        const { 
            rute_id, supervisor_id, dispatcher_id, date, vt_id,
            driver1, driver2, helper1, helper2,
            bbm, time_out, time_back
        } = req.body

        const start = moment().startOf("year").format("YYYY-MM-DD")
        const end   = moment().endOf("year").format("YYYY-MM-DD")
        const year = moment(start).format("YYYY")

        const sj_count_raw = await SuratJalan.count({
            where: { date: { [Op.between]: [start, end] } }
        })
        const sj_count = String(sj_count_raw + 1).padStart(3, '0')

        const vt = await VT.findOne({ where: { vt_id } })
        const surat_jalan_id = `SJ-${Math.random().toString(36).substring(2, 19).toUpperCase()}`

        const qr = { surat_jalan_id }
        const qrString = JSON.stringify(qr)
        const qrImage = await QRCode.toDataURL(qrString)

        const new_surat_jalan = await SuratJalan.create({
            surat_jalan_id,
            no_surat_jalan: `SJ-VT/${vt.no_vt}/${year}/${sj_count}`,
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
            const templatePath = path.join(__dirname, "../data/template_sj.docx")
            const content = readFileSync(templatePath, "binary")
        
            const zip = new PizZip(content)
        
            const imageOpts = {
                centered: false,
                getImage: function (tagValue) {
                    const base64 = tagValue.replace(/^data:image\/\w+base64,/, "")
                    return Buffer.from(base64, "base64")
                },
                getSize: function () {
                    return [150, 150]
                }
            }
            
            const doc = new Docxtemplater(zip, {
                modules: [new ImageModule(imageOpts)],
                paragraphLoop: true,
                linebreaks: true,
                delimiters: { start: '[[', end: ']]' }
            })

            const sj = await SuratJalan.findOne({
                where: { surat_jalan_id: new_surat_jalan.surat_jalan_id },
                include: [
                    {
                        model: Rute,
                        as: 'rute',
                        attributes: ['nama_rute']
                    },
                    {
                        model: PersonelSuratJalan,
                        as: 'personel_surat_jalan',
                        include: {
                            model: Personel,
                            as: 'personel',
                            attributes: ['nama_personel']
                        },
                        attributes: ['personel_id', 'role']
                    },
                    {
                        model: VT,
                        as: 'vt'
                    },
                    {
                        model: User,
                        as: 'dispatcher',
                        attributes: ['nama']
                    }
                ]
            })

            const qrBase64 = qrImage.replace(/^data:image\/pngbase64,/, "")
            const format = (n) => n ? new Intl.NumberFormat("id-ID").format(n) : ""
            const formatTime = (t) => t ? moment(t, "HH:mm:ss").format("HH:mm") : ""
        
            doc.render({
                no_sj: new_surat_jalan.no_surat_jalan || "",
                date: moment(sj.date).format("DD-MM-YYYY") || "",
                rute: sj.rute.nama_rute || "",
                driver1: sj.personel_surat_jalan.find(p => p.role === "driver1")?.personel?.nama_personel || "",
                helper1: sj.personel_surat_jalan.find(p => p.role === "helper1")?.personel?.nama_personel || "",
                driver2: sj.personel_surat_jalan.find(p => p.role === "driver2")?.personel?.nama_personel || "",
                helper2: sj.personel_surat_jalan.find(p => p.role === "helper2")?.personel?.nama_personel || "",
                no_vt: sj.vt.no_vt || "",
                plat: sj.vt.plat || "",
                kapasitas: sj.vt.kapasitas ? `${format(sj.vt.kapasitas)} L` : "",
                bbm: sj.bbm ? `${format(sj.bbm)} L` : "",
                time_out: sj.time_out ? `${formatTime(sj.time_out)} WIB` : "",
                time_back: sj.time_back ? `${formatTime(sj.time_back)} WIB` : "",
                dispatcher: sj.dispatcher.nama || "",
                qr: qrBase64
            })
        
            const buf = doc.getZip().generate({
                type: "nodebuffer",
                compression: "DEFLATE"
            })
        
            const outputDir = path.join(__dirname, "../uploads/sj")
            const filePath = path.join(outputDir, `${new_surat_jalan.surat_jalan_id}.docx`)
        
            writeFileSync(filePath, buf)
            console.log("File SJ dibuat:", filePath)
        
        } catch (e) {
            const errorLogPath = path.join(__dirname, "../uploads/sj/log_error.txt")
            writeFileSync(errorLogPath, JSON.stringify(e, null, 2))
        
            console.error("DOCX ERROR (saved to file):", errorLogPath)
        }        

        res.json({
            message: "Surat Jalan berhasil ditambahkan"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})
*/

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
                        include: {
                            model: Personel,
                            as: 'personel'
                        }
                    },
                    {
                        model: Rute,
                        as: 'rute'
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
                        include: {
                            model: Personel,
                            as: 'personel'
                        }
                    },
                    {
                        model: Rute,
                        as: 'rute'
                    }
                ]
            }
        ],
        order: [['date', 'ASC']]
    })
}

router.post("/get", verifyToken, async (req, res) => {
    try {
        const { surat_jalan_id } = req.body

        const surat_jalan = await getSuratJalanOne({ surat_jalan_id })

        res.json({
            message: "Surat Jalan berhasil diambil",
            surat_jalan
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
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
            message: "Surat Jalan berhasil diambil",
            surat_jalans
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
})

router.post("/trip", verifyToken, async (req, res) => {
    const t = await sequelize.transaction()

    try {
        const { 
            trip_id, surat_jalan_id, rute_id,
            volume_loading, volume_unloading,
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

        if (!trip) {
            const newTripId = `T-${Math.random().toString(36).substring(2, 20).toUpperCase()}`

            await TripSuratJalan.create({
                trip_id: newTripId,
                surat_jalan_id,
                rute_id,
                volume_loading,
                jam_loading,
                no_segel
            }, { transaction: t })

            const roles = [
                { id: driver, role: "driver" },
                { id: helper, role: "helper" },
                { id: op_loading, role: "op_loading" }
            ].filter(p => p.id)

            for (const p of roles) {
                await PersonelTrip.create({
                    trip_id: newTripId,
                    personel_id: p.id,
                    role: p.role
                }, { transaction: t })
            }

        } else {
            trip.volume_unloading = volume_unloading
            trip.jam_unloading = jam_unloading
            trip.selisih = trip.volume_loading - volume_unloading

            await trip.save({ transaction: t })

            if (op_unloading) {
                await PersonelTrip.create({
                    trip_id: trip.trip_id,
                    personel_id: op_unloading,
                    role: "op_unloading"
                }, { transaction: t })
            }
        }

        await t.commit()

        res.json({ message: "Trip berhasil diproses" })

    } catch (error) {
        console.error(error)
        await t.rollback()
        res.status(500).json({ message: error.message })
    }
})

export default router