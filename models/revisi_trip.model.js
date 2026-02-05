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

    supervisor_id: {
        type: DataTypes.STRING(15),
        allowNull: true,
        references: {
            model: User,
            as: 'supervisor'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },

    column_revisi: {
        type: DataTypes.ENUM('gross', 'net'),
        allowNull: false
    },

    value_revisi: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },

    reason_revisi: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    operator_id: {
        type: DataTypes.STRING(15),
        allowNull: false,
        references: {
            model: Personel,
            as: 'operator'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    }
}, {
    tableName: 'revisi_trip',
    timestamps: false,
    underscored: true
})

export default RevisiTrip