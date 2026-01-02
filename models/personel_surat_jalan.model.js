import { DataTypes } from "sequelize"
import sequelize from "../db.js"
import SuratJalan from "./surat_jalan.model.js"
import Personel from "./personel.model.js"

const PersonelSuratJalan = sequelize.define('personel_surat_jalan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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

    personel_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
            model: Personel,
            key: 'personel_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    role: {
        type: DataTypes.ENUM('driver1', 'driver2', 'helper1', 'helper2'),
        allowNull: false
    }
}, {
    tableName: 'personel_surat_jalan',
    timestamps: false,
    underscored: true
})

export default PersonelSuratJalan