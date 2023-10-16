const express = require("express");
const session = require("express-session");
const mongoos = require("mongoose");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const path = require("path");
const multer = require('multer');
const app = express();

mongoos.connect("mongodb://127.0.0.1:27017/zudio");
app.use(session({ secret: "secret", saveUninitialized: true, resave: false }));

app.use("/public", express.static(path.join(__dirname, "./public")));

app.use("/", userRoute); 
app.use("/admin", adminRoute);



app.listen(3000, function () {
  console.log("server is running @ http://localhost:3000");
});
          