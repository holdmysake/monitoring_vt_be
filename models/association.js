const defineAssociation = models => {
    models.SuratJalan.belongsTo(models.User, {
        foreignKey: 'supervisor_id',
        targetKey: 'user_id',
        as: 'supervisor'
    })

    models.SuratJalan.belongsTo(models.User, {
        foreignKey: 'dispatcher_id',
        targetKey: 'user_id',
        as: 'dispatcher'
    })

    models.SuratJalan.belongsTo(models.Rute, {
        foreignKey: 'rute_id',
        targetKey: 'rute_id',
        as: 'rute'
    })

    models.SuratJalan.belongsTo(models.VT, {
        foreignKey: 'vt_id',
        targetKey: 'vt_id',
        as: 'vt'
    })

    models.Rute.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'user_id',
        as: 'supervisor'
    })

    models.PersonelSuratJalan.belongsTo(models.SuratJalan, {
        foreignKey: 'surat_jalan_id',
        targetKey: 'surat_jalan_id',
        as: 'surat_jalan'
    })

    models.SuratJalan.hasMany(models.PersonelSuratJalan, {
        foreignKey: 'surat_jalan_id',
        sourceKey: 'surat_jalan_id',
        as: 'personel_surat_jalan'
    })

    models.PersonelSuratJalan.belongsTo(models.Personel, {
        foreignKey: 'personel_id',
        targetKey: 'personel_id',
        as: 'personel'
    })

    models.TripSuratJalan.belongsTo(models.SuratJalan, {
        foreignKey: 'surat_jalan_id',
        targetKey: 'surat_jalan_id',
        as: 'surat_jalan'
    })

    models.SuratJalan.hasMany(models.TripSuratJalan, {
        foreignKey: 'surat_jalan_id',
        sourceKey: 'surat_jalan_id',
        as: 'trip_surat_jalan'
    })

    models.TripSuratJalan.belongsTo(models.Rute, {
        foreignKey: 'rute_id',
        targetKey: 'rute_id',
        as: 'rute'
    })

    models.PersonelTrip.belongsTo(models.TripSuratJalan, {
        foreignKey: 'trip_id',
        targetKey: 'trip_id',
        as: 'trip_surat_jalan'
    })

    models.TripSuratJalan.hasMany(models.PersonelTrip, {
        foreignKey: 'trip_id',
        sourceKey: 'trip_id',
        as: 'personel_trip'
    })

    models.PersonelTrip.belongsTo(models.Personel, {
        foreignKey: 'personel_id',
        targetKey: 'personel_id',
        as: 'personel'
    })

    models.PersonelTrip.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'user_id',
        as: 'user'
    })

    models.Personel.belongsTo(models.Personel, {
        foreignKey: 'def_helper',
        targetKey: 'personel_id',
        as: 'helper',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    })

    models.Personel.belongsTo(models.VT, {
        foreignKey: 'def_vt',
        targetKey: 'vt_id',
        as: 'vt'
    })
}

export default defineAssociation