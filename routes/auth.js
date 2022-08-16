const express = require("express")
const fs = require("fs")
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
], async (req, res) => {

    // arrays of errors
    const errors = validationResult(req);

    // checking whether getting any error if yes then return
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0] });
    }

    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ success: false, message: "User with same email already exists" })
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
            // displayPicture: req.body.displayPicture,
            contact: req.body.contact,
            gender: req.body.gender,
            city: req.body.gender
        })

        blob = req.body.displayPicture.replace(/^data:image\/png;base64,/, '');

        const isExists = fs.existsSync(`../fetn/public/Images/users/${user._id}`)
        // console.log(isExists);
        if (!isExists) {
            fs.mkdirSync(`../fetn/public/Images/users/${user._id}`)
        }

        fs.writeFile(`../fetn/public/Images/users/${user._id}/dp.png`, blob, "base64", (err) => {
            if (err) {
                console.log(err);
            }
        })

        let updatedUser = { displayPicture: `${user._id}/dp.png`};
        user = await User.findByIdAndUpdate(user._id, { $set: updatedUser }, { new: true });

        // data for token 
        let data = {
            user: {
                id: user.id
            }
        }

        // Signing token
        let authtoken = jwt.sign(data, JWT_TOKEN);

        // Sending token in response
        res.json({ success: true, authtoken, user });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route 2 : Logging a user /auth/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        // Checking user with email exists or not
        let user = await User.findOne({ email });

        if (!user) {
            // Not found
            return res.status(401).json({ success: false, message: "Invalid Credentials" })
        }
        // Matching passwords by bcrypt.compare
        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if (!isPasswordMatched) {
            // If not matched
            return res.status(401).json({ success: false, message: "Invalid Credentials" })
        }

        // Data for token
        let data = {
            user: {
                id: user.id
            }
        }

        // Signing token
        let authtoken = await jwt.sign(data, JWT_TOKEN);

        // Sending token in response
        res.json({ success: true, authtoken });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route 3 : Deleting a user /auth/deleteUser
router.delete("/deleteUser", async (req, res) => {
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
        res.json({ success: true, message: "User deleted successfully" });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route 4 : Updating User details /auth/updateUser - Login is required
router.post("/updateUser", fetchUser, async (req, res) => {
    let updatedUser = {};
    try {
        let { name, password, institution, yearOfGraduation, displayPicture, gender, city, currentPassword, about, contact } = req.body;
        if (!currentPassword) {
            return res.status(400).json({ success: false, message: "Incorrect current password" })
            // currentPassword = "";
        }
        // Array of destructured details
        const detailsArr = [name, password, institution, yearOfGraduation, displayPicture, gender, city, about, contact];
        const detailsVarArr = ['name', 'password', 'institution', 'yearOfGraduation', 'displayPicture', 'gender', 'city', 'about', 'contact'];

        for (let i = 0; i < detailsArr.length; i++) {
            if (detailsArr[i] && detailsArr[i] !== displayPicture) {
              updatedUser[detailsVarArr[i]] = detailsArr[i];
            }
        }

        if (password) {
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
            return res.status(403).json({ success: false, message: "Check your credentials and try again!" })
        }

        // Updating the user details

        if(displayPicture){
            const dpExists = fs.existsSync(`../fetn/public/Images/users/${user._id}/dp.png`)
             if (dpExists) {
                 fs.unlinkSync(`../fetn/public/Images/users/${user._id}/dp.png`);
             }
     
             blob = displayPicture.replace(/^data:image\/png;base64,/, "");
     
             fs.writeFile(`../fetn/public/Images/users/${user._id}/dp.png`, blob, "base64", (err) => {
                 if (err) {
                     console.log(err);
                 }
             })
        }

        user = await User.findByIdAndUpdate(userId, { $set: updatedUser }, { new: true });
        res.json({ success: true, updatedUser: user });
    }
    catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, message: err.message });
    }
})

// Route 5: /getUser - to get info about user, Login required

router.get("/getUser/:id", fetchUser, async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).select("-password -__v");
        if (!user) {
            // Not found
            return res.status(404).json({ success: false, message: "No such user exists" })
        }
        res.json({ success: true, user });
    } catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, error: err.message });
    }
})

// Route 6: /getSelfInfo - to get self info, Login required

router.get("/getSelfInfo", fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password -__v");
        if (!user) {
            // Not found
            return res.status(404).json({ success: false, message: "No such user exists" })
        }
        res.json({ success: true, user });
    } catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, error: err.message });
    }
})

// Route 7: /getUsersList - to get info about user, Login required

router.get("/getUsersList", fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        let users = await User.find().select("-password -date -__v");
        if (!users) {
            // Not found
            return res.status(404).json({ success: false, message: "No users's list found" })
        }
        res.json({ success: true, users });
    } catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, error: err.message });
    }
})

// Route 8: /addToWishlist - to add product in user's wishlist, Login required
router.post("/addToWishlist", fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId);
        const { productId } = req.body;
        let wishlist;
        let updatedUser;
        let isAdded;
        if (!user) {
            // Not found
            return res.status(401).json({ success: false, message: "Needs authentictaion" })
        }

        if (user.wishlist.includes(productId)) {
            let ind = user.wishlist.indexOf(productId);
            wishlist = user.wishlist;
            wishlist.splice(ind,1);
            isAdded = false;
        }
        else {
            wishlist = [productId , ...user.wishlist];
            isAdded = true;
        }
        updatedUser = { wishlist }
        // Updating the user details
        user = await User.findByIdAndUpdate(userId, { $set: updatedUser }, { new: true });
        res.json({ success: true, user, isAdded });
    } catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ success: false, error: err.message });
    }
})

// Route 9: /addNotification- to add a notification in user's notifications, No login required
router.post("/addNotification",fetchUser ,async (req, res) => {
  try {
    const userId = req.body.id;
    let user = await User.findById(userId);
    if (!req.user.id) {
      // User not found
      return res
        .status(401)
        .json({ success: false, message: "Needs authentictaion" });
    }
    if (!user) {
      // Seller not found
      return res
        .status(403)
        .json({ success: false, message: "Seller not found" });
    }
    const { notification } = req.body;
    let date = new Date();
    date = date.getDate() + "/" + Number(date.getUTCMonth()+1) + "/" + date.getUTCFullYear();
    let updatedUser = { notifications: [{time: date, message: notification}, ...user.notifications] };

    // Updating the user details
    user = await User.findByIdAndUpdate(
      userId,
      { $set: updatedUser },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    // catching the error message if any occurred
    res.status(400).json({ success: false, error: err.message });
  }
});

// Route 9: /deleteNotification- to delete a notification from user's notifications, Login required
router.post("/deleteNotification", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId);
    if (!user) {
      // Not found
      return res
        .status(401)
        .json({ success: false, message: "Needs authentictaion" });
    }
    var { notificationInd, deleteCount } = req.body;
    if (!deleteCount){
        deleteCount = 1;
    } 
    user.notifications.splice(notificationInd, deleteCount);
    let updatedUser = {
      notifications: user.notifications
    };

    // Updating the user details
    user = await User.findByIdAndUpdate(
      userId,
      { $set: updatedUser },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    // catching the error message if any occurred
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
