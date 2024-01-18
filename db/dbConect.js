const mongoose = require('mongoose');

exports.dbConnection = async () => {
    mongoose.set('strictQuery', true)
    await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('Db Connected')
        }).catch((err) => {
            console.log(err)
        })
}