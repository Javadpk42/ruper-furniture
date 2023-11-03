const express = require("express");
const session = require("express-session");
const mongoos = require("mongoose");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const path = require("path");
const multer = require("multer");
const app = express();

const dotenv= require('dotenv')
dotenv.config()
mongoos.connect(process.env.MONGO_URI);

app.use(session({ secret: "secret", saveUninitialized: true, resave: false }));

// app.use("/public", express.static(path.join(__dirname, "./public")));
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/", userRoute);
app.use("/admin", adminRoute);

app.listen(process.env.PORT, function () {
  console.log("server is running @ http://localhost:3000");
});
  