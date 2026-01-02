import { DataTypes } from "sequelize"
import sequelize from "../db.js"

const Record = sequelize.define('record', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    vt_id: {
        type: DataTypes.STRING(10),
        allowNull: false
    },

    lat: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },

    lng: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },

    speed: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },

    alt: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },

    dir: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },

    sat: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    timestamp: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'record',
    timestamps: false,
    underscored: true
})

export default Record