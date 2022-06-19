const express = require("express")
const router = express.Router();
const User = require("../models/User")
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchUser = require('../middlewares/fetchUser');

// Encoded by webCalculator and Google Encoder
const JWT_TOKEN = "MTAwMDExMCAxMDAwMTAxIDEwMTAxMDAgMTAwMTExMCAxMDAwMDAgMTExMDAxMSAxMTAxMDAxIDExMDAxMTEgMTEwMTExMCAxMTAwMDAxIDExMTAxMDAgMTExMDEwMSAxMTEwMDEwIDExMDAxMDEgMTAwMDAwIDExMDEwMTEgMTEwMDEwMSAxMTExMDAx";

// Routes for /auth
// router.get("/",(req, res)=>{
//     res.send("Auth json")
// })

// Route 1 : Creating a user /auth/signup
router.post("/signup", [
    // validation checks
    body('email', "Enter a vaild email address").isEmail(),
    body('password', "Password must be of atleast 5 characters long").isLength({ min: 5 }),
    body('name', "Name must be of atleast 3 characters long").isLength({ min: 3 }),
    body('institution', "Institution name must be of atleast 3 characters long").isLength({ min: 3 })
] , async (req, res)=>{

    // arrays of errors
    const errors = validationResult(req);

    // checking whether getting any error if yes then return
    if (!errors.isEmpty()) {
        return res.status(400).json({success : false, message: errors.array()[0] });
    }

    try {
        let user = await User.findOne({email: req.body.email});
        if(user){
            return res.status(400).json({ success: false, message: "User with same email already exists"})
        }

        // Generating salt
        let salt = await bcrypt.genSalt(10);

        // Generating hashed password
        let hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        // Creating user
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            institution: req.body.institution,
            yearOfGraduation: req.body.yearOfGraduation,
            displayPicture: req.body.displayPicture,
            contactNumber: req.body.contactNumber,
            gender: req.body.gender,
            city: req.body.gender
        })

        // data for token 
        let data = {
            user :{
                id: user.id
            }
        }

        // Signing token
        let authtoken = jwt.sign(data, JWT_TOKEN);
        
        // Sending token in response
        res.json({success: true, authtoken});
    }
    catch(err){
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route 2 : Logging a user /auth/login
router.post("/login", async (req, res)=>{
    const {email, password} = req.body;
    try {
        // Checking user with email exists or not
        let user = await User.findOne({email});

        if(!user){
            // Not found
            return res.status(401).json({success: false, message: "Invalid Credentials"})
        }
        // Matching passwords by bcrypt.compare
        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if(!isPasswordMatched){
            // If not matched
            return res.status(401).json({ success: false, message: "Invalid Credentials" })
        }

        // Data for token
        let data = {
            user : {
                id: user.id
            }
        }

        // Signing token
        let authtoken = await jwt.sign(data, JWT_TOKEN);

        // Sending token in response
        res.json({ success: true, authtoken });
    }
    catch(err){
         // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route 3 : Deleting a user /auth/deleteUser
router.delete("/deleteUser", async (req, res)=>{
    const { name, email, password } = req.body;
    try {
        // Checking user with email exists or not
        let user = await User.findOne({ email });

        if (!user) {
            // Not found
            return res.status(403).json({ success: false, message: "Forbidden action, try with proper credentials" })
        }
        // Matching passwords by bcrypt.compare
        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if (!isPasswordMatched) {
            // If password not matched
            return res.status(403).json({ success: false, message: "Forbidden action, try with proper credentials" })
        }

        if (name !== user.name) {
            // If name not matched
            return res.status(403).json({ success: false, message: "Forbidden action, try with proper credentials" })
        }

        const id = user.id;
        // res.send(id);
        let result = await User.findByIdAndDelete(id);
        res.json({success: true, message: "User deleted successfully"});
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route 4 : Updating User details /auth/updateUser - Login is required
router.put("/updateUser", fetchUser, async (req, res)=>{
    let updatedUser = {};
    try{
        let { name, password, institution, yearOfGraduation, displayPicture, contactNumber, gender, city, currentPassword, about } = req.body;
        if(!currentPassword){
            return res.status(400).json({ success: false, message: "Incorrect current password" })
            // currentPassword = "";
        }
        // Array of destructured details
        const detailsArr = [name, password, institution, yearOfGraduation, displayPicture, contactNumber, gender, city, about];
        const detailsVarArr = ['name', 'password', 'institution', 'yearOfGraduation', 'displayPicture', 'contactNumber', 'gender', 'city', 'about'];
        
        for (let i = 0; i < detailsArr.length; i++) {   
            if (detailsArr[i]){
                updatedUser[detailsVarArr[i]] = detailsArr[i];
            }
        }
        
        if(password){
            // console.log(password);
            // Generating salt for new password
            let salt = await bcrypt.genSalt(10);

            // Generating hashed password for new password
            let hashedPassword = await bcrypt.hash(password, salt);

            updatedUser["password"] = hashedPassword;
        }
        
        const userId = req.user.id;
        let user = await User.findById(userId);
        // console.log(user);
        if (!user) {
            // Not found
            return res.status(403).json({ success: false, message: "Forbidden action" })
        }

        // Matching passwords by bcrypt.compare
        // console.log(currentPassword);
        const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordMatched) {
            // If password not matched
            return res.status(403).json({ success: false, message: "Forbidden action" })
        }

        // Updating the user details
        user = await User.findByIdAndUpdate(userId, { $set: updatedUser }, { new: true });
        res.json({ success: true, updatedUser});
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route 5: /getUser - to get info about user, Login required

router.get("/getUser", fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password -__v");
        if (!user) {
            // Not found
            return res.status(404).json({ success: false, message: "No such user exists" })
        }
        res.json(user);
    } catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ error: err.message });
    }
})

// Route 6: /getUsersList - to get info about user, Login required

router.get("/getUsersList", fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        let users = await User.find().select("-password -date -__v");
        if (!users) {
            // Not found
            return res.status(404).json({ success: false, message: "No users's list found" })
        }
        res.json(users);
    } catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ error: err.message });
    }
})

module.exports = router;
