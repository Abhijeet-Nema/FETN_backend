const express = require("express")
const router = express.Router();

// routes for /auth
router.get("/", (req, res) => {
    res.send("Product json")
})

module.exports = router;
