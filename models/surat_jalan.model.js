import { DataTypes } from "sequelize"
import sequelize from "../db.js"
import Rute from "./rute.model.js"
import User from "./user.model.js"
import VT from "./vt.model.js"

const SuratJalan = sequelize.define('surat_jalan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    surat_jalan_id: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false
    },

    no_surat_jalan: {
        type: DataTypes.STRING(30),
        unique: true,
        allowNull: false
    },

    qr: {
        type: DataTypes.TEXT,
        allowNull: false
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

    supervisor_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
            model: User,
            key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    dispatcher_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
            model: User,
            key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    vt_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
            model: VT,
            key: 'vt_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    date: {
        type: DataTypes.DATE,
        allowNull: false
    },

    bbm: {
        type: DataTypes.FLOAT,
        allowNull: true
    },

    time_out: {
        type: DataTypes.TIME,
        allowNull: true
    },

    time_back: {
        type: DataTypes.TIME,
        allowNull: true
    }
}, {
    tableName: 'surat_jalan',
    timestamps: false,
    underscored: true
})

export default SuratJalan