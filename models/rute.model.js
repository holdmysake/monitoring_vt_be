import { DataTypes } from "sequelize"
import sequelize from "../db.js"
import User from "./user.model.js"

const Rute = sequelize.define('rute', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    rute_id: {
        type: DataTypes.STRING(10),
        unique: true,
        allowNull: false
    },

    nama_rute: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    jarak: {
        type: DataTypes.FLOAT,
        allowNull: true
    },

    user_id: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
            model: User,
            key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },

    tipe_rute: {
        type: DataTypes.ENUM('road', 'field', 'traffic'),
        allowNull: true
    },

    buffer: {
        type: DataTypes.FLOAT,
        allowNull: true
    },

    path: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'rute',
    timestamps: false,
    underscored: true
})

export default Rute