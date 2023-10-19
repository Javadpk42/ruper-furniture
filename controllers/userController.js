const userModel = require("../model/userModel")

const Category = require('../model/productModel').category;
const Product = require('../model/productModel').product;

const bcrypt=require('bcrypt');
const { name } = require('ejs');
const otpGenerator=require("otp-generator")
const nodemailer=require("nodemailer")
const path=require("path")

const securePassword=async(password)=>{
    try {
       const passwordHash= await bcrypt.hash(password,10)
       return passwordHash
    } catch (error) {
        console.log(error.message)
    }
}

const otpSent = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'csa20218042@gmail.com',
                pass: 'vigb bpay kixl wbng',
            },
        });

        const mailOptions = {
            from: 'csa20218042@gmail.com',
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Your OTP is: <strong>${otp}</strong></p>`
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error.message);
    }
}


const homeLoad=async(req,res)=>{
    try {
        res.render('home')
    } catch (error) {
        console.log(error.message )
    }
}
// const shopLoad=async(req,res)=>{
//     try {
//         res.render('shop')
//     } catch (error) {
//         console.log(error.message )
//     }
// }



const shopLoad = async (req, res) => {
  try {
    const categories = await Category.find({ is_listed: true });
    const products = await Product.find();

    console.log(products); // Log products to console for verification

    res.render('shop', { categories, products });
  } catch (error) {
    console.log(error.message);
  }
};


const shopdetailsLoad = async (req, res) => {
    try {
        // Assuming the product ID is provided in the request parameters
        const productId = req.params.productId;

        // Fetch the product details based on productId
        const product = await Product.findById(productId);

        // Render the shopdetails template with the product data
        res.render('shopdetails', { product });
    } catch (error) {
        console.log(error.message);
        // Handle errors, e.g., render an error page
        res.render('error', { error: 'Product not found' });
    }
};


const loginLoad=async(req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message )
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        console.log("Email:", email);
        console.log("Password:", password);
        const userData = await userModel.findOne({ email: email });
        console.log(userData);
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                req.session.user_id = userData._id;
                res.redirect('/');
            } else {
                res.render('login', { errors: "Email and password is incorrect" });
            }
        } else {
            res.render('login', { errors: "Email and password is incorrect" });
        }
    } catch (error) {
        console.log(error.message);
    }
};



const loadRegister=async(req,res)=>{
    try{
        res.render('registration')
    }
    catch(error){
       console.log(error.message)
    }
}
const loadOtp=async(req,res)=>{
    try{
        res.render('otp')
    }
    catch(error){
       console.log(error.message)
    }
}
 


const insertUser = async (req, res) => {
    try {
        // Generate OTP
        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
        
        // Store OTP and its creation time in the session
        const currentTime = new Date();
        const otpCreationTime = currentTime.getMinutes()
        req.session.otp = {
            code: otp,
            creationTime: otpCreationTime,
        };

        const userCheck = await userModel.findOne({ email: req.body.email });

        if (userCheck) {
            res.render('registration', { message: "Email already exists" });
        } else {
            const spassword = await securePassword(req.body.password);

            req.session.username = req.body.username;
            // req.session.lastName = req.body.lastName;
            req.session.mobile = req.body.mobile;
            req.session.email = req.body.email;

            if (req.body.username&& req.body.email && req.session.mobile) {
                if (req.body.password === req.body.cpassword) {
                    req.session.password = spassword;

                    // Send OTP to the user's email
                    otpSent(req.session.email, req.session.otp.code);
                    res.render("otp");
                } else {
                    res.render("registration", { message: "Password doesn't match" });
                }
            } else {
                res.render("registration", { message: "Please enter all details" });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
};



const verifyOTP = async (req, res) => {
    try {
        const enteredOTP = req.body.otp;
        const storedOTP = req.session.otp.code;
        const otpCreationTime = req.session.otp.creationTime;

        // Calculate the time difference in seconds
        const currentTimeFull = new Date();
        const currentTime = currentTimeFull.getMinutes()

        const timeDiff = (currentTime - otpCreationTime);

        if (enteredOTP === storedOTP && timeDiff <= 1) {
            // OTP is valid and within the 1-minute window
            const user = new userModel({
                username: req.session.username,
                // lastName: req.session.lastName,
                email: req.session.email,
                mobile: req.session.mobile,
                password: req.session.password,
                is_verified: 1
            });

            const result = await user.save();
            res.redirect("/login");
        } else {
            res.render('otp', { message: "Invalid OTP or OTP has expired" });
        }
    } catch (error) {
        console.log(error.message);
    }
};

const resendOTP = async (req, res) =>{
    try {
        // Generate a new OTP and resend it to the user's email
        const newOTP = otpGenerator.generate(6, { upperCase: false, specialChars: false });
        req.session.otp.code = newOTP;
        // Update the OTP creation time
        const currentTime = new Date();
        req.session.otp.creationTime = currentTime.getMinutes()
        // Send the new OTP to the user's email
        otpSent(req.session.email, req.session.otp.code);

        res.render("otp", { message: "OTP resent successfully" });


    } catch (error) {
        console.log(error.message);
    }
}
module.exports={
    homeLoad,
    shopLoad,
    shopdetailsLoad,
    loginLoad,
    verifyLogin,
    loadRegister,
    loadOtp,
    insertUser,
    verifyOTP,
    resendOTP
   
}