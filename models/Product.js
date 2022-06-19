const express, { Schema } = require("express");
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
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    course: {
        type: String,
        required: true
    },
    description: {
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
    }
})

const Product = mongoose.model("product", productSchema)
module.exports = Product;