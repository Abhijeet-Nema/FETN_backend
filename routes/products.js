const express = require("express")
const fs = require("fs")
const router = express.Router();
const Product = require("../models/Product");
const User = require("../models/User");
const fetchUser = require("../middlewares/fetchUser")
const { body, validationResult } = require('express-validator');


// routes for /products
// router.get("/", (req, res) => {
//     res.send("Products json")
// })

// Route : 1 - Listing a product /listProduct   (Login required)
router.post("/listProduct", fetchUser, [
    // validation checks
    body('name', "Name of product must be of atleast 3 characters long").isLength({ min: 3 }),
    body('sellingPrice', "Selling price must be defined").isLength({ min: 1 }),
    body('productImages', "Product images must be uploaded").isLength({ min: 1 }),
    body('description', "Desciption must be 10 characters long").isLength({ min: 10 })
], async (req, res) => {

    // arrays of errors
    const errors = validationResult(req);

    // checking whether getting any error if yes then return
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0] });
    }

    let user = await User.findById(req.user.id);

    if (!user) {
        // Not found
        return res.status(401).json({ success: false, message: "Needs authentictaion" })
    }

    try {
        let product = await Product.create({
            name: req.body.name,
            actualPrice: req.body.actualPrice,
            sellingPrice: req.body.sellingPrice,
            discount: Math.round((req.body.actualPrice - req.body.sellingPrice) * 100 / req.body.actualPrice),
            // productImages: req.body.productImages,
            category: req.body.category,
            tags: req.body.tags,
            course: req.body.course,
            description: req.body.description,
            availability: req.body.availability,
            quantity: req.body.quantity,
            seller: req.user.id,
            takeAwayPlace: user.institution
        })

        let newArr = req.body.productImages;
        newArr.forEach((element, i) => {
            blob = element.replace(/^data:image\/png;base64,/, '');

            const isExists = fs.existsSync(`../fetn/public/Images/products/${product._id}`)
            // console.log(isExists);
            if (!isExists) {
                fs.mkdirSync(`../fetn/public/Images/products/${product._id}`)
            }

            fs.writeFile(`../fetn/public/Images/products/${product._id}/view_${i + 1}.png`, blob, "base64", (err) => {
                if (err) {
                    console.log(err);
                }
            })
            newArr[i] = `${product._id}/view_${i + 1}.png`
        })

        let updatedProduct = { productImages: newArr }
        product = await Product.findByIdAndUpdate(product._id, { $set: updatedProduct }, { new: true });
        res.json({ success: true, product });
    }
    catch (err) {
        // catching the error message if any occurred
        return res.status(400).json({ success: false, message: err.message });
    }

    ;
})

// Route : 2 - Deleting a product /deleteProduct   (Login required)
router.delete("/deleteProduct/:id", fetchUser, async (req, res) => {
    const productId = req.params.id;
    try {
        let product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "No such product found" })
        }
        if (product.seller.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: "Not permitted to perform this action" });
        }
        product = await Product.findByIdAndDelete(productId);
        res.status(200).json({ success: true, message: "Product delisted successfully", product });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 3 - Editing a product /editProduct   (Login required)
router.put("/editProduct/:id", fetchUser, async (req, res) => {
    const productId = req.params.id;
    try {
        let product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "No such product found" })
        }
        if (product.seller.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: "Not permitted to perform this action" });
        }

        let updatedProduct = {};
        let { name, actualPrice, sellingPrice, discount, productImages, category, tags, course, description, availability, quantity, reportsCount, reports } = req.body;

        const detailsArr = [name, actualPrice, sellingPrice, discount, productImages, category, tags, course, description, availability, quantity, reportsCount, reports];

        const detailsVarArr = ['name', 'actualPrice', 'sellingPrice', 'discount', 'productImages', 'category', 'tags', 'course', 'description', 'availability', 'quantity', 'reportsCount', 'reports']

        for (let i = 0; i < detailsArr.length; i++) {
            if (detailsArr[i]) {
                updatedProduct[detailsVarArr[i]] = detailsArr[i];
            }
        }

        // Updating the product
        updatedProduct = await Product.findByIdAndUpdate(productId, { $set: updatedProduct }, { new: true });

        res.status(200).json({ success: true, message: "Product editied successfully", updatedProduct });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 4 - Getting information about product /getProduct   (No Login required)
router.get("/getProduct/:id", async (req, res) => {
    const productId = req.params.id;
    if (!productId) {
        return res.status(400).json({ success: false, message: "Illegal action" })
    }
    try {
        let product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "No such product found" })
        }
        res.status(200).json({ success: true, product });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 5 - Get all products /getAllProducts (No login required)
router.get("/getAllProducts", async (req, res) => {
    try {
        let limit = req.body.limit;
        let startFrom = req.body.startFrom;
        if(!limit){
           limit = false;
        }
        if (!startFrom){
            startFrom = 0;
        }
        let count = await Product.countDocuments();
        let products = await Product.find({}, null, {skip: startFrom, limit: limit });
        if (!products) {
            return res.status(404).json({ success: false, message: "No such product found" })
        }
        res.status(200).json({ success: true, resultsCount: count, products});
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 6 - Get all products of a seller /getProductsBySeller (No login required)
router.get("/getProductsBySeller/:id", async (req, res) => {
    try {
        const sellerId = req.params.id;
        let count = await Product.countDocuments();
        let products = await Product.find({ seller: sellerId }, null, { limit: 2 });
        if (!products) {
            return res.status(404).json({ success: false, message: "No such product found" })
        }
        res.status(200).json({ success: true, resultsCount: count, products });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 7 - Get all products related to a institution /getProductsByInstitution (No login required)
router.post("/getProductsByInstitution/:name", async (req, res) => {
    try {
        let limit = req.body.limit;
        let startFrom = req.body.startFrom;

        if (!startFrom) {
            startFrom = 0;
        }

        if(!limit){
           limit = false;
        }
        const InstitutionName = req.params.name;
        let count = await Product.countDocuments({ takeAwayPlace: InstitutionName });
        let products = await Product.find({ takeAwayPlace: InstitutionName }, null, {skip: startFrom, limit: limit });
        if (!products) {
            return res.status(404).json({ success: false, message: "No such product found" })
        }
        res.status(200).json({ success: true, resultsCount: count, products });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 8 - Report a product /reportProduct (Login required)
router.post("/reportProduct/:id", [
    body('report', "Report description must be 4 characters long").isLength({ min: 4 }),
], fetchUser, async (req, res) => {
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
        if (product.reportedBy.includes(req.user.id)) {
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

// Route : 9 - Get all products by sorting /getSortedProducts (No login required)
router.post("/getSortedProducts", async (req, res) => {
    try {
        let limit = req.body.limit;
        let startFrom = req.body.startFrom;

        if (!startFrom) {
            startFrom = 0;
        }

        if (!limit) {
            limit = false;
        }
        var { sortingType } = req.body;
        if (!sortingType) {
            sortingType = "sellingPrice"
        }
        let value = -1;
        if (sortingType === "sellingPrice") {
            value = 1
        }
        
        let count = await Product.countDocuments();
        let products = await Product.find({}, null, {skip: startFrom ,limit: limit}).sort({ [sortingType]: value });
        if (!products) {
            return res.status(404).json({ success: false, message: "No such product found" })
        }
        res.status(200).json({ success: true, resultsCount: count ,products });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route : 10 - Get products search results /searchProducts (No login required)
router.post("/searchProducts", async (req, res) => {
    let matching;
    const { query } = req.body;
    const queryArr = query.split(" ");
    // console.log(queryArr);
    try {
        let products = await Product.find();
        products = products.filter((e) => {
            matching = 0;
            queryArr.forEach((q) => {
                if (e.name.toLowerCase().includes(q.toLowerCase()) || e.description.toLowerCase().includes(q.toLowerCase()) || e.category.toLowerCase().includes(q.toLowerCase()) || e.tags.includes(q.toLowerCase())) {
                    matching++;
                }
            })
            e.__v = matching;
            // console.log(e.__v);
            return matching;
        })

        // Sorting products by __v
        for (let i = 0; i < products.length-1; i++) {
            for (let j = i; j < products.length; j++) {
                if (products[i].__v < products[j].__v){
                    let temp = products[i];
                    products[i] = products[j];
                    products[j] = temp;
                }
            }
        }

        if (!products) {
            return res.status(404).json({ success: false, message: "No such product found" })
        }
        res.status(200).json({ success: true, resultsCount: products.length, products });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

module.exports = router;
