import { DataTypes } from "sequelize"
import sequelize from "../db.js"
import VT from "./vt.model.js"

const Personel = sequelize.define('personel', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    personel_id: {
        type: DataTypes.STRING(10),
        unique: true,
        allowNull: false
    },

    nama_personel: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    no_hp: {
        type: DataTypes.STRING(15),
        allowNull: false
    },

    foto: {
        type: DataTypes.STRING(50),
        allowNull: true
    },

    ktp: {
        type: DataTypes.STRING(50),
        allowNull: true
    },

    sim: {
        type: DataTypes.STRING(50),
        allowNull: true
    },

    siml: {
        type: DataTypes.STRING(50),
        allowNull: true
    },

    sim_expired_at: {
        type: DataTypes.DATE,
        allowNull: true
    },

    siml_expired_at: {
        type: DataTypes.DATE,
        allowNull: true
    },

    is_driver: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },

    def_helper: {
        type: DataTypes.STRING(10),
        allowNull: true
    },

    def_vt: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
            model: VT,
            as: 'vt'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    }
}, {
    tableName: 'personel',
    timestamps: false,
    underscored: true
})

export default Personel