const mongoose = require('mongoose')
const mongoUrl = "mongodb://localhost:27017/FETN?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false";

const connectToDB = ()=>{
    mongoose.connect(mongoUrl,()=>{
        console.log('Connected to Database');
    })
}

module.exports = connectToDB;