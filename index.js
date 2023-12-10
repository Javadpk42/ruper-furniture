const passport = require('passport');
const session = require("express-session");
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoos = require("mongoose");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const path = require("path");
const multer = require("multer");  
const app = express();


mongoos.connect(process.env.MONGO_URI); 

app.use(session({ secret: "secret", saveUninitialized: true, resave: false }));
app.set('view engine','ejs'); 

app.use(passport.initialize());
app.use(passport.session());

app.use("/public", express.static(path.join(__dirname, "public")));

const disable = (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "1");
  next();
};
app.use(disable); 


app.use("/admin", adminRoute);
app.use("/", userRoute);



app.listen(process.env.PORT, function () {
  console.log("server is running @ http://localhost:3000");
});
