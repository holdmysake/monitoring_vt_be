import { DataTypes } from "sequelize"
import sequelize from "../db.js"
import TripSuratJalan from "./trip_surat_jalan.model.js"
import User from "./user.model.js"
import Personel from "./personel.model.js"

const RevisiTrip = sequelize.define('revisi_trip', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    revisi_id: {
        type: DataTypes.STRING(15),
        allowNull: false
    },

    trip_id: {
        type: DataTypes.STRING(15),
        allowNull: false,
        references: {
            model: TripSuratJalan,
            as: 'trip'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    gross_volume: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },

    net_volume: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },

    is_loading_trip: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },

    reason_revisi: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'revisi_trip',
    timestamps: false,
    underscored: true
})

export default RevisiTrip