const express = require("express")
const router = express.Router();
const Product = require("../models/Product");
const fetchUser = require("../middlewares/fetchUser")
const { body, validationResult } = require('express-validator');
const { findById } = require("../models/Product");


// routes for /products
// router.get("/", (req, res) => {
//     res.send("Products json")
// })

// Route : 1 - Listing a product /listProduct   (Login required)
router.post("/listProduct", fetchUser, [
    // validation checks
    body('name', "Name of product must be of atleast 3 characters long").isLength({ min: 3 }),
    body('sellingPrice', "Selling price must be defined").isLength({min: 1}),
    body('productImages', "Product images must be uploaded").isLength({ min: 1 }),
    body('description', "Desciption must be 10 characters long").isLength({min: 10})
] ,async (req, res)=>{

    // arrays of errors
    const errors = validationResult(req);

    // checking whether getting any error if yes then return
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0] });
    }

    try{
        let product = await Product.create({
            name: req.body.name,
            acutalPrice: req.body.acutalPrice,
            sellingPrice: req.body.sellingPrice,
            productImages: req.body.productImages,
            category: req.body.category,
            tags: req.body.tags,
            course: req.body.course,
            description: req.body.description,
            availability: req.body.availability,
            quantity: req.body.quantity,
            seller: req.user.id
        })
        res.json({success: true, product});
    }
    catch (err){
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 2 - Deleting a product /deleteProduct   (Login required)
router.delete("/deleteProduct/:id", fetchUser, async(req, res)=>{
    const productId = req.params.id;
    try{
        let product = await Product.findById(productId);
        if(!product){
           return res.status(404).json({success: false, message: "No such product found"})
        }
        if(product.seller.toString() !== req.user.id){
            return res.status(401).json({success: false, message: "Not permitted to perform this action"});
        }
        product = await Product.findByIdAndDelete(productId);
        res.status(200).json({success: true, message: "Product delisted successfully", product});
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 3 - Editing a product /editProduct   (Login required)
router.put("/editProduct/:id", fetchUser, async(req, res)=>{
    const productId = req.params.id;
    try{
        let product = await Product.findById(productId);
        if(!product){
           return res.status(404).json({success: false, message: "No such product found"})
        }
        if(product.seller.toString() !== req.user.id){
            return res.status(401).json({success: false, message: "Not permitted to perform this action"});
        }

        let updatedProduct = {};
        let { name, acutalPrice, sellingPrice, productImages, category, tags, course, description, availability, quantity, reportsCount, reports} = req.body;

        const detailsArr = [name, acutalPrice, sellingPrice, productImages, category, tags, course, description, availability, quantity, reportsCount, reports];

        const detailsVarArr = ['name', 'acutalPrice', 'sellingPrice', 'productImages', 'category', 'tags', 'course', 'description', 'availability', 'quantity', 'reportsCount', 'reports']

        for (let i = 0; i < detailsArr.length; i++) {
            if (detailsArr[i]) {
                updatedProduct[detailsVarArr[i]] = detailsArr[i];
            }
        }

        // Updating the product
        updatedProduct = await Product.findByIdAndUpdate(productId, { $set: updatedProduct }, { new: true });

        res.status(200).json({ success: true, message: "Product editied successfully", updatedProduct});
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 4 - Getting information about product /getProduct   (No Login required)
router.get("/getProduct/:id", async(req, res)=>{
    const productId = req.params.id;
    if(!productId){
        return res.status(400).json({ success: false, message: "Illegal action" })
    }
    try{
        let product = await Product.findById(productId);
        if(!product){
           return res.status(404).json({success: false, message: "No such product found"})
        }
        res.status(200).json({ success: true, product});
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 5 - Get all products /getAllProducts (No login required)
router.get("/getAllProducts", async (req, res)=>{
    try {
        let products = await Product.find();
        if (!products) {
            return res.status(404).json({ success: false, message: "No such product found" })
        }
        res.status(200).json({ success: true, products });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 6 - Get all products of a seller /getProductsBySeller (No login required)
router.get("/getProductsBySeller/:id", async (req, res)=>{
    try {
        const sellerId = req.params.id;
        let products = await Product.find({seller: sellerId});
        if (!products) {
            return res.status(404).json({ success: false, message: "No such product found" })
        }
        res.status(200).json({ success: true, products });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 7 - Report a product /reportProduct (Login required)
router.post("/reportProduct/:id", [
    body('report', "Report description must be 8 characters long").isLength({ min: 8 }),
], fetchUser, async (req, res)=>{
    try {
        let updatedProduct = {};
        let availability = "available" 

        // arrays of errors
        const errors = validationResult(req);

        // checking whether getting any error if yes then return
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array()[0] });
        }

        const productId = req.params.id;
        let product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "No such product found" })
        }

        let message = "Product reported successfully";
        // console.log((product.reportsCount));

        // If already reported, remove the report
        if(product.reportedBy.includes(req.user.id)){
            if (Number(product.reportsCount) - 1 <= 10) {
                availability = "available"
            }
            let ind = product.reportedBy.indexOf(req.user.id);
            product.reports.splice(ind, 1)
            product.reportedBy.splice(ind, 1)

            updatedProduct = {
                availability: availability,
                reportsCount: Number(product.reportsCount) - 1,
                reports: product.reports,
                reportedBy: product.reportedBy
            }
            message = "Report has been taken down";
            console.log(updatedProduct);
        }
        // else include it
        else {
            if (Number(product.reportsCount) + 1 > 10) {
                availability = "blacklisted"
            }
            updatedProduct = {
                availability: availability,
                reportsCount: Number(product.reportsCount) + 1,
                reports: product.reports.concat(req.body.report),
                reportedBy: product.reportedBy.concat(req.user.id)
            }
            message = "Product reported successfully";
        }

        // Updating the product
        updatedProduct = await Product.findByIdAndUpdate(productId, { $set: updatedProduct }, { new: true });

        res.status(200).json({ success: true, message, updatedProduct });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

module.exports = router;
