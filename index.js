console.log("Let's begin!");
const express = require("express");
const cors = require("cors");
const connectToDB = require("./db")
const path = require("path")
connectToDB();
require("dotenv").config();

const app = express();
const port = process.env.PORT

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors())


app.get("/",(req, res)=>{
    res.send("FETN on service!")
})

app.get("/Images/users/:user/dp.png", function (req, res) {
  res.sendFile(path.join(__dirname, "Images/users", req.params.user + "/dp.png"));
});

app.get("/Images/products/:product/:view", function (req, res) {
  res.sendFile(path.join(__dirname, "Images/products", `${req.params.product}/${req.params.view}`));
});

app.use("/auth", require("./routes/auth"))
app.use("/products", require("./routes/products"))

app.listen(port, ()=>{
    console.log(`FETN in running on port ${port}`);
})