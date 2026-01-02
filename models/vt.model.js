import { DataTypes } from "sequelize"
import sequelize from "../db.js"

const VT = sequelize.define('vt', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    vt_id: {
        type: DataTypes.STRING(10),
        unique: true,
        allowNull: false
    },

    plat: {
        type: DataTypes.STRING(15),
        allowNull: false
    },

    no_vt: {
        type: DataTypes.STRING(15),
        allowNull: false
    },

    kapasitas: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'vt',
    timestamps: false,
    underscored: true
})

export default VT