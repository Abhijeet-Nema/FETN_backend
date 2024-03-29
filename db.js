const mongoose = require('mongoose')
const url ="mongodb+srv://FETN_backend:cJWPlYG87yNos0Io@cluster0.rjofmvc.mongodb.net/FETN";
// const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false";

const connectionParams={
useNewUrlParser: true,
useUnifiedTopology: true 
}

const connectToDB = ()=>{
mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to the database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. ${err}`);
    })
}

module.exports = connectToDB;