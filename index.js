import express from "express"
import dotenv from "dotenv"
import sequelize from "./db.js"
import cors from "cors"
import defineAssociation from "./models/association.js"
import { Models } from './models/index.js'
import "./subscriber.js"
import path from "path"
import { fileURLToPath } from "url"

import personelRoute from "./routes/personel.route.js"
import userRouter from "./routes/user.route.js"
import ruteRouter from "./routes/rute.route.js"
import suratjalanRouter from "./routes/surat_jalan.route.js"
import vtRouter from "./routes/vt.route.js"

dotenv.config()

defineAssociation(Models)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())
app.use(cors())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

app.use("/api/personel", personelRoute)
app.use("/api/user", userRouter)
app.use("/api/rute", ruteRouter)
app.use("/api/suratjalan", suratjalanRouter)
app.use("/api/vt", vtRouter)

const startServer = async () => {
    try {
        await sequelize.authenticate()
        console.log("Database connected")

        const PORT = process.env.PORT
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} mantap`)
        })
    } catch (error) {
        console.error("Unable to connect to the database:", error)
    }
}

startServer()