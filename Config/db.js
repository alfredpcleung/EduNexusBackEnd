require('dotenv').config()
const mongoose = require('mongoose');

module.exports = function(){

    mongoose.connect(process.env.ATLAS_DB);

    var mongodb = mongoose.connection;

    mongodb.on('error', console.error.bind(console, 'Connection Error: '));
    mongodb.once('open', () => {
        console.log('====> Connected to MongoDb.');
    })

    return mongodb;
}
