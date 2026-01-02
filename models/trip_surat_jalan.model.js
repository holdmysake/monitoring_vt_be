import { DataTypes } from "sequelize"
import sequelize from "../db.js"
import SuratJalan from "./surat_jalan.model.js"
import Rute from "./rute.model.js"
import Personel from "./personel.model.js"
import User from "./user.model.js"

const TripSuratJalan = sequelize.define('trip_surat_jalan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    trip_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },

    surat_jalan_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: {
            model: SuratJalan,
            key: 'surat_jalan_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    rute_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
            model: Rute,
            key: 'rute_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    volume_loading: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    jam_loading: {
        type: DataTypes.TIME,
        allowNull: false
    },

    volume_unloading: {
        type: DataTypes.FLOAT,
        allowNull: true
    },

    jam_unloading: {
        type: DataTypes.TIME,
        allowNull: true
    },

    selisih: {
        type: DataTypes.FLOAT,
        allowNull: true
    },

    no_segel: {
        type: DataTypes.STRING(20),
        allowNull: false
    }
}, {
    tableName: 'trip_surat_jalan',
    timestamps: false,
    underscored: true
})

export default TripSuratJalan