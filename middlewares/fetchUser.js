const jwt = require("jsonwebtoken")
const JWT_TOKEN = "MTAwMDExMCAxMDAwMTAxIDEwMTAxMDAgMTAwMTExMCAxMDAwMDAgMTExMDAxMSAxMTAxMDAxIDExMDAxMTEgMTEwMTExMCAxMTAwMDAxIDExMTAxMDAgMTExMDEwMSAxMTEwMDEwIDExMDAxMDEgMTAwMDAwIDExMDEwMTEgMTEwMDEwMSAxMTExMDAx";

const fetchUser = (req, res, next)=>{
    try {
        const token = req.header("auth-token");
        if (!token) {
            return res.status(403).json({success: false, message: "Autenticate to do this action" });
        }
        const data = jwt.verify(token, JWT_TOKEN);
        req.user = data.user;
        next(); // to call next middleware function
    } catch (err) {
        // catching the error message if any occurred
        res.status(400).json({ error: err.message });
    }
}

module.exports = fetchUser;