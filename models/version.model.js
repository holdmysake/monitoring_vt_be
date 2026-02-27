import { DataTypes } from "sequelize"
import sequelize from "../db.js"

const Version = sequelize.define('version', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    version: {
        type: DataTypes.STRING(10),
        unique: true,
        allowNull: false
    },

    download_url: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'version',
    timestamps: false,
    underscored: true
})

export default Version