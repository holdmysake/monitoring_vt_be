import { DataTypes } from "sequelize"
import sequelize from "../db.js"
import TripSuratJalan from "./trip_surat_jalan.model.js"
import Personel from "./personel.model.js"
import User from "./user.model.js"

const PersonelTrip = sequelize.define('personel_trip', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    trip_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: {
            model: TripSuratJalan,
            key: 'trip_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    personel_id: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
            model: Personel,
            key: 'personel_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    user_id: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
            model: User,
            key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    role: {
        type: DataTypes.ENUM('driver', 'helper', 'op_loading', 'op_unloading'),
        allowNull: false
    }
}, {
    tableName: 'personel_trip',
    timestamps: false,
    underscored: true
})

export default PersonelTrip