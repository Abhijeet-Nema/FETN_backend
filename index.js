console.log("Let's begin!");
const express = require("express");
const cors = require("cors");
const connectToDB = require("./db")
connectToDB();

const app = express();
const port = 5000

app.use(express.json())
app.use(cors())

app.get("/",(req, res)=>{
    res.send("FETN on service!")
})

app.use("/auth", require("./routes/auth"))
app.use("/products", require("./routes/products"))

app.listen(port, ()=>{
    console.log(`FETN in running on port ${port}`);
})