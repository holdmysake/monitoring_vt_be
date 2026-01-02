import { DataTypes } from "sequelize"
import sequelize from "../db.js"

const User = sequelize.define('user', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    user_id: {
        type: DataTypes.STRING(10),
        unique: true,
        allowNull: false
    },

    username: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },

    nama: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    email: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },

    password: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    no_hp: {
        type: DataTypes.STRING(15),
        allowNull: true
    },

    role: {
        type: DataTypes.ENUM('admin', 'user'),
        allowNull: false
    },

    jabatan: {
        type: DataTypes.ENUM('admin', 'dispatcher', 'superviso', 'operator'),
        allowNull: true
    }
}, {
    tableName: 'user',
    timestamps: false,
    underscored: true,
    defaultScope: {
        attributes: { exclude: ['password'] }
    }
})

export default User