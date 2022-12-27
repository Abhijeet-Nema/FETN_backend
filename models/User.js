// const mongoose, { Schema } = require("mongoose");
const mongoose = require("mongoose")
const { Schema } = require("mongoose");

const userSchema = new Schema({
    name : {
        type: String,
        required: true
    },
    email: {
        type: String,
        required : true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        default: Date.now
    },
    institution:{
        type: String,
        required: true
    },
    yearOfGraduation :{
        type: String
    },
    displayPicture: {
        type: String
    },
    gender : {
        type: String
    },
    city: {
        type: String,
        required : true
    },
    about: {
        type: String
    },
    contact: {
        type: String,
        required: true
    },
    wishlist: {
        type: Array
    },
    notifications: {
        type: Array
    }
})

const User = mongoose.model("user", userSchema)
module.exports = User;