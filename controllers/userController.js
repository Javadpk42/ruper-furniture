const userModel = require("../model/userModel")
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

const sendVerificationEmail = async (email, otp) => {
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

// const generateOTP=()=>{
//     return Math.floor(100000+Math.random()*900000).toString();
// }

const loginLoad=async(req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message )
    }
}
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
        const otpCode = otpGenerator.generate(6);
        const otpcurTime = Date.now() / 1000;
        const otpExpiry = otpcurTime + 60;

        const userCheck = await userModel.findOne({ email: req.body.email });

        if (userCheck) {
            return res.render('registration', { message: "User already exists" });
        }

        console.log("Hashing password...");

        if (req.body.password && req.body.cpassword) {
            const spassword = await securePassword(req.body.password);
            console.log("Password hashed:", spassword)
            req.session.username = req.body.username;
            req.session.mobile = req.body.mobile;
            req.session.email = req.body.email;

            if (req.body.username && req.body.email && req.session.mobile) {
                if (req.body.password === req.body.cpassword) {
                    req.session.password = spassword;
                    console.log("Password stored in session:", req.session.password);

                    req.session.otp = {
                        code: otpCode,
                        expiry: otpExpiry,
                    };

                    
                    await sendVerificationEmail(req.session.email, req.session.otp.code);

                    res.render("otp");
                } else {
                    res.render("registration", { message: "Password doesn't match" });
                }
            } else {
                res.render("registration", { message: "Please enter all details" });
            }
        } else {
            res.render("registration", { message: "Please enter password and confirm password" });
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};



const verifyOTP = async (req, res) => {
    try {
        console.log("Retrieved hashed password from session:", req.session.password);

        if (req.body.otp === req.session.otp.code) {
            const user = new userModel({
                username: req.session.username,
                email: req.session.email,
                mobile: req.session.mobile,
                password: req.session.password, 
                is_verified: 1
            });

            const result = await user.save();
            console.log("User saved successfully:", result);
            res.redirect("/login");
        } else {
            res.render('otp', { message: "Invalid OTP" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

 
module.exports={
    loginLoad,
    loadRegister,
    loadOtp,
    insertUser,
    verifyOTP
   
}