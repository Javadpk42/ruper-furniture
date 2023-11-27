const express = require("express");
const session = require("express-session");
const mongoos = require("mongoose");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const path = require("path");
const multer = require("multer");
const app = express();

const dotenv = require("dotenv");
dotenv.config();
mongoos.connect(process.env.MONGO_URI); //

app.use(session({ secret: "secret", saveUninitialized: true, resave: false }));
app.set('view engine','ejs'); 

app.use("/public", express.static(path.join(__dirname, "public")));




app.use("/", userRoute);
app.use("/admin", adminRoute);

// Error Handling Middleware
// app.use((err,req, res, next) => {
//   res.status(500).render("user/500");
// });

// app.use((req, res, next)=>{
//   res.status(404).render("user/404");
// })


app.listen(process.env.PORT, function () {
  console.log("server is running @ http://localhost:3000");
});
