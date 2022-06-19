const mongoose = require("mongoose")
const { Schema } = require("mongoose");
const productSchema = new Schema({
    name: {
        type: String
    },
    acutalPrice: {
        type: Number,
        required: true
    },
    sellingPrice: {
        type: Number,
        required: true
    },
    date: {
        type: String,
        default: Date.now
    },
    productImages: {
        type: Array,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    tags:{
        type: Array
    },
    course: {
        type: String
    },
    description: {
        type: String,
        required: true
    },
    availability: {
        type: String,
        required: true
    },
    quantity:{
        type: Number,
        default : 1
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    reportsCount:{
        type: Number,
        default: 0
    },
    reports:{
        type: Array
    }
})

const Product = mongoose.model("product", productSchema)
module.exports = Product;