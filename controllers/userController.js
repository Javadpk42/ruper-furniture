const userModel = require("../model/userModel")
const mongoose = require('mongoose');


const shortid = require('shortid');

const Category = require('../model/productModel').category;
const Product = require('../model/productModel').product;
const Cart = require('../model/cartModel')
const { ObjectId } = require('mongoose').Types;

const Address = require("../model/addressModel")
const Order = require("../model/orderModel")
const Coupon = require("../model/couponModel")
const Wishlist = require("../model/wishlistModel")



const bcrypt = require('bcrypt');
const { name } = require('ejs');
const ejs = require('ejs');

const fs = require('fs');
const puppeteer = require('puppeteer');
const otpGenerator = require("otp-generator")
const nodemailer = require("nodemailer")
const path = require("path")
const randomstring = require('randomstring');
const { product } = require("../model/productModel");

const Razorpay = require('razorpay')
const crypto = require("crypto")

//hashing

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash
  } catch (error) {
    console.log(error.message)
  }
}

//home

const homeLoad = async (req, res) => {
  try {
    res.render('home', { user: req.session.user_id })
  } catch (error) {
    console.log(error.message)
  }
}

//registration

//load registration

const loadSignup = async (req, res) => {
  try {
    res.render('registration', { message: null })
  }
  catch (error) {
    console.log(error.message)
  }
}

//load otp

const loadOtp = async (req, res) => {
  try {
    res.render('otp')
  }
  catch (error) {
    console.log(error.message)
  }
}




// const sendOtp = async (req, res) => {
//   try {
//     // Generate OTP
//     const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

//     // Store OTP and its creation time in the session
//     const currentTime = new Date();
//     const otpCreationTime = currentTime.getMinutes();
//     req.session.otp = {
//       code: otp,
//       creationTime: otpCreationTime,
//     };

//     const userCheck = await userModel.findOne({ email: req.body.email });

//     if (userCheck) {
//       res.render('registration', { message: 'Email is already registered. Please use a different email.' });
//     } else {
//       const spassword = await securePassword(req.body.password);

//       req.session.username = req.body.username;
//       req.session.mobile = req.body.mobile;
//       req.session.email = req.body.email;

//       if (req.body.username && req.body.email && req.session.mobile) {
//         if (req.body.password === req.body.cpassword) {
//           req.session.password = spassword;

//           // Send OTP to the user's email
//           otpSent(req.session.email, req.session.otp.code);
//           res.render('otp');
//         } else {
//           res.render('registration');
//         }
//       } else {

//       }
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };


const sendOtp = async (req, res) => {
  try {
    // Generate OTP
    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

    // Store OTP and its creation time in the session
    const currentTime = new Date();
    const otpCreationTime = currentTime.getMinutes();
    req.session.otp = {
      code: otp,
      creationTime: otpCreationTime,
    };

    const userCheck = await userModel.findOne({ email: req.body.email });

    if (userCheck) {
      res.render('registration', { message: 'Email is already registered. Please use a different email.' });
      return;
    }

    const spassword = await securePassword(req.body.password);

    req.session.username = req.body.username;
    req.session.mobile = req.body.mobile;
    req.session.email = req.body.email;

    // Check if a referral code is provided in the registration form
    if (req.body.referralCode) {
      // Check if the referral code provided by the user exists
      const referringUser = await userModel.findOne({ referralCode: req.body.referralCode });

      if (referringUser) {
        req.session.referralUserId = referringUser._id; // Save referring user ID in session
      } else {
        res.render('registration', { message: 'Invalid referral code. Please use a valid referral code.' });
        return;
      }
    }

    // Generate a unique referral code using shortid
    const referralCode = shortid.generate();
    req.session.referralCode = referralCode; // Save referral code in session

    if (req.body.username && req.body.email && req.session.mobile) {
      if (req.body.password === req.body.cpassword) {
        req.session.password = spassword;

        // Send OTP to the user's email
        otpSent(req.session.email, req.session.otp.code);
        res.render('otp');
      } else {
        res.render('registration');
      }
    } else {
      // Handle other form fields if needed
    }
  } catch (error) {
    console.log(error.message);
  }
};




const resendOtp = async (req, res) => {
  try {
    // Initialize req.session.otp if not already initialized
    req.session.otp = req.session.otp || {};

    // Generate a new OTP and resend it to the user's email
    const newOTP = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    req.session.otp.code = newOTP;

    // Update the OTP creation time
    const currentTime = new Date();
    req.session.otp.creationTime = currentTime.getMinutes();

    // Send the new OTP to the user's email
    otpSent(req.session.email, req.session.otp.code);

    res.render("otp", { message: "OTP resent successfully" });
  } catch (error) {
    console.log(error.message);
  }
};


//otp sending to mail function

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


// verifying otp and adding user to database

// const verifyOtp = async (req, res) => {
//   try {
//     const enteredOTP = req.body.otp;
//     const storedOTP = req.session.otp.code;
//     const otpCreationTime = req.session.otp.creationTime;

//     // Calculate the time difference in seconds
//     const currentTimeFull = new Date();
//     const currentTime = currentTimeFull.getMinutes()

//     const timeDiff = (currentTime - otpCreationTime);

//     if (enteredOTP === storedOTP && timeDiff <= 1) {
//       // OTP is valid and within the 1-minute window
//       const user = new userModel({
//         username: req.session.username,
//         // lastName: req.session.lastName,
//         email: req.session.email,
//         mobile: req.session.mobile,
//         password: req.session.password,
//         is_verified: true,
//         referralCode: shortid.generate(),
//       });

//       const result = await user.save();
//       res.redirect("/login");
//     } else {
//       res.render('otp', { message: "Invalid OTP or OTP has expired" });
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };


const verifyOtp = async (req, res) => {
  try {
    const enteredOTP = req.body.otp;
    const storedOTP = req.session.otp.code;
    const otpCreationTime = req.session.otp.creationTime;

    // Calculate the time difference in seconds
    const currentTimeFull = new Date();
    const currentTime = currentTimeFull.getMinutes();

    const timeDiff = currentTime - otpCreationTime;

    if (enteredOTP === storedOTP && timeDiff <= 1) {
      // OTP is valid and within the 1-minute window
      // const spassword = await securePassword(req.session.password);

      const referralCode = req.session.referralCode; // Assuming this is how you capture referral code from the form

      // Create a new user
      const user = new userModel({
        username: req.session.username,
        email: req.session.email,
        mobile: req.session.mobile,
        password: req.session.password,
        is_verified: true,
        referralCode: referralCode, // Set the referral code
      });

      // Save user details
      const result = await user.save();

      // If there's a referral code, update referredBy in the referring user's document
      if (referralCode) {
        const referringUserId = req.session.referralUserId;
        const referringUser = await userModel.findById(referringUserId);

        if (referringUser) {
          referringUser.referredBy = result._id;
          await referringUser.save();

          // Award a bonus of 100 to both the referrer and the referred user
          const bonusAmount = 100;

          referringUser.wallet += bonusAmount;
          referringUser.walletHistory.push({
            date: new Date(),
            amount: bonusAmount,
            description: `Referral bonus for user ${result.username}`,
            transactionType: 'Credit',
          });
          await referringUser.save();

          result.wallet += bonusAmount;
          result.walletHistory.push({
            date: new Date(),
            amount: bonusAmount,
            description: 'Referral bonus',
            transactionType: 'Credit',
          });
          await result.save();
        }
      }

      res.redirect("/login");
    } else {
      res.render('otp', { message: "Invalid OTP or OTP has expired" });
    }
  } catch (error) {
    console.log(error.message);
  }
};






//loginload

const loginLoad = async (req, res) => {
  try {
    const errorMessage = req.query.errors;

    res.render('login', { errors: errorMessage })
  } catch (error) {
    console.log(error.message)
  }
}


const verifyLogin = async (req, res) => {
  try {


    const email = req.body.email;
    const password = req.body.password;

    // Check if email or password is missing
    if (!email || !password) {
      res.render('login', { errors: "Please fill in both email and password fields" });
      return;
    }

    // console.log("Email:", email);
    // console.log("Password:", password);
    const userData = await userModel.findOne({ email: email });

    if (userData) {
      // Check if the user is blocked (is_verified === 1)
      if (userData.is_verified === false) {
        res.render('login', { errors: "Your account is blocked. Contact support for assistance." });
        return;
      }

      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        req.session.user_id = userData._id;
        res.redirect('/');
      } else {
        res.render('login', { errors: "Email and password are incorrect" });
      }
    } else {
      res.render('login', { errors: "Email and password are incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect('/')
  } catch (error) {
    console.log(error.message)
  }
}

//forgot

const forgotLoad = async (req, res) => {
  try {
    res.render('forgot')
  } catch (error) {
    console.log(error.message)
  }
}
//for sending  mail function
const resetPasswordMail = async (username, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'csa20218042@gmail.com',
        pass: 'vigb bpay kixl wbng',
      }
    })

    const mailOptions = {
      from: 'csa20218042@gmail.com',
      to: email,
      subject: "For Reset Password",
      html: `<p> Hi, ${username}, please click here to <a href="http://localhost:3000/resetpassword?token=${token}"> Reset </a> your password</p>`
    }

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email Has been Sent:-", info, response);
      }
    })
  } catch (error) {
    console.log(error);
  }
}

const forgotVerify = async (req, res) => {
  try {
    const email = req.body.email
    const userData = await userModel.findOne({ email: email })

    if (userData) {
      if (userData.isVerified === false) {
        res.render('forgot', { message: "Please verify your mail" })
      } else {
        const randomString = randomstring.generate()
        const updatedData = await userModel.updateOne({ email: email },
          { $set: { token: randomString } })

        resetPasswordMail(userData.username, userData.email, randomString)
        res.render('forgot', { message: "Please Check Your Mail to Reset Your Password" })
      }
    } else {
      res.render('forgot', { message: "User email is Incorrect" })
    }
  } catch (error) {
    console.log(error);
  }
}


const resetpasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;

    // Assuming you have a 'token' field in your user schema
    const user = await userModel.findOne({ token: token });

    if (user) {
      // Render the view with the user information

      res.render('reset', { user_id: user._id });
    } else {
      res.render('404', { message: 'Token is Invalid' });
    }
  } catch (error) {
    console.log(error);
  }
};

//resetting password  

const resetPassword = async (req, res) => {
  try {
    const id = req.body.id;
    // console.log('User ID from form submission:', id);

    if (!id) {
      console.log('User ID is missing in the form submission');
      return res.status(400).send('User ID is missing in the form submission');
    }

    // You may want to validate the password and confirm password fields here
    const password = req.body.password;

    // Hash the new password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password in the database
    const user = await userModel.findOneAndUpdate(
      { _id: id },
      { $set: { password: hashedPassword } },
      { new: true }
    );


    if (!user) {
      console.log('User not found in the database');
      return res.status(404).send('User not found in the database');
    }

    // console.log('Password reset successful');
    // res.status(200).send('Password reset successful');
    res.redirect("/login")

  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};

//profile dashboard

const takeUserData = async (userId) => {
  try {
    const userData = await userModel.findOne({ _id: userId });
    // console.log('Retrieved User Data:', userData); 
    return userData;
  } catch (error) {
    console.log('Error retrieving user data:', error);
    throw error; // Re-throw the error to handle it in the calling function if needed
  }
};




const profileLoad = async (req, res) => {
  try {
    // Check if there is an active login session
    if (!req.session.user_id) {
      return res.redirect('/login?errors=Please log in to view');
    }

    const userId = req.session.user_id;

    // Fetch user data
    const userData = await takeUserData(userId);

    // Fetch user address data
    const addressData = await Address.findOne({ user_id: userId });
    const coupons = await Coupon.find()

    // Fetch user orders
    const orders = await Order.find({ user: userId }).sort({ orderDate: -1 });

    // Fetch user cart
    const cart = await Cart.findOne({ user: userId }).populate('products.productId');


    // Check if userData is not null or undefined
    if (userData) {
      res.render('profile', { users: userData, user: userId, address: addressData ? addressData.address : null, orders, cart, coupons });
    } else {
      console.log('User Data is null or undefined');
      res.render('profile', { users: null, user: userId, orders: [], cart: null });
    }
  } catch (error) {
    console.log(error);
    res.render('profile', { users: null, user: req.session.user_id, address: null, orders: [], cart: null, error: 'Error fetching user data' });
  }
};



const invoiceDownload = async (req, res, next) => {
  try {
    const { orderId } = req.query;
    console.log('orderId:', orderId);

    // const orderData = await Order.findById(orderId).populate('cart.products.productId');
    const orderData = await Order.findById(orderId).populate('cart.products.productId').populate('user');

    console.log('orderData:', orderData);

    if (!orderData) {
      // Handle the case where the order with the specified orderId doesn't exist
      console.log('Order not found');
      return res.status(404).send('Order not found');
    }

    const userId = req.session.user_id;
    let sumTotal = 0;
    const userData = await userModel.findById(userId);
    console.log('userData:', userData);

    orderData.cart.products.forEach(item => {
      const total = item.productId.product_price * item.quantity;
      sumTotal += total;
    });

    console.log('sumTotal:', sumTotal);

    const date = new Date();
    console.log('date:', date);

    const data = {
      order: orderData,
      user: userData,
      date,
      sumTotal,
    };

    const filepathName = path.resolve(__dirname, "../views/user/invoice.ejs");
    const html = fs.readFileSync(filepathName).toString();
    const ejsData = ejs.render(html, data);

    console.log('ejsData:', ejsData);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(ejsData, { waitUntil: "networkidle0" });
    const pdfBytes = await page.pdf({ format: "Letter" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=order_invoice.pdf"
    );
    res.send(pdfBytes);
  } catch (error) {
    console.error('Error in invoiceDownload:', error);
    next(error);
  }
};



const orderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Fetch order details
    const order = await Order.findById(orderId).populate({
      path: 'cart.products.productId',
      model: 'product',
    });

    // Check if the order exists
    if (!order) {
      return res.status(404).render('error', { message: 'Order not found' });
    }


    // Access the order details
    const { cart, deliveryAddress, paymentOption, totalAmount, orderDate, status } = order;

    // Render order details view with order data
    res.render('orderdetails', {
      order: {
        _id: order._id,
        user: order.user,
        cart,
        deliveryAddress,
        paymentOption,
        totalAmount,
        orderDate,
        status,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error fetching order details' });
  }
};








const cancelOrderAjax = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(orderId);

    // Find the order in the database
    const order = await Order.findOne({ 'cart.products._id': orderId })
      .populate({
        path: 'cart.products.productId',
        model: 'product',
      });
    console.log(order);

    // Check if the order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Refund logic based on payment method
    for (const product of order.cart.products) {
      if (
        product._id.toString() === orderId &&
        (product.orderStatus === 'Placed' || product.orderStatus === 'Shipped' || product.orderStatus === 'Out for delivery')
      ) {
        const refundedAmount = product.productId.product_price;

        if (order.paymentOption === 'Razorpay' || order.paymentOption === 'Wallet') {
          // Refund the amount to the user's wallet
          await userModel.findByIdAndUpdate(
            { _id: order.user },
            {
              $inc: { wallet: refundedAmount },
              $push: {
                walletHistory: {
                  date: new Date(),
                  amount: refundedAmount,
                  description: `Refund from Order cancel - Order ${order._id}`,
                  transactionType: 'Credit',
                },
              },
            }
          );

          // Update the order status to 'Cancelled' for the specific product
          product.orderStatus = 'Cancelled';
          break; // Exit the loop after processing the specific product
        } else if (order.paymentOption === 'COD') {
          // Handle COD payment method (replace this comment with actual COD logic)
          // Update the order status to 'Cancelled' for the specific product
          product.orderStatus = 'Cancelled';
          // Handle any specific COD refund logic if needed
          break; // Exit the loop after processing the specific product
        }
      }
    }

    // Save the updated order
    await order.save();

    // Respond with JSON indicating success
    res.json({ success: true, message: 'Order canceled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to cancel the order' });
  }
};


const returnOrderAjax = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Find the order in the database
    const order = await Order.findOne({ 'cart.products._id': orderId })
      .populate({
        path: 'cart.products.productId',
        model: 'product',
      });

    // Check if the order exists
    if (!order) {
      console.log('Order not found');
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Find the product in the order
    const product = order.cart.products.find(p => p._id.toString() === orderId);

    // Check if the product exists
    if (!product) {
      console.log('Product not found in the order');
      return res.status(404).json({
        success: false,
        message: 'Product not found in the order',
      });
    }

    // Check if the return is within 14 days from the expected delivery date
    const currentDate = new Date().getTime();
    const expectedDeliveryDate = new Date(product.expectedDelivery).getTime();

    const fourteenDaysInMilliseconds = 14 * 24 * 60 * 60 * 1000;

    if (currentDate - expectedDeliveryDate > fourteenDaysInMilliseconds) {
      console.log('Return period has exceeded');
      return res.status(400).json({
        success: false,
        message: 'Return period has exceeded',
      });
    }

    // Update the returnOrder status and returnStatus
    product.returnOrder.status = true;
    product.returnOrder.returnStatus = 'Placed';

    // Save the updated order
    await order.save();

    console.log('Order returned successfully');

    // Respond with JSON indicating success
    return res.json({ success: true, message: 'Order returned successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to return the order' });
  }
};












const updateProfile = async (req, res, next) => {
  try {
    const userId = req.session.user_id;

    const username = req.body.username;
    const mobile = req.body.mobile;

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).send('User not found');
    }

    // Validate other fields if needed

    // Update user profile fields
    userData.username = username;
    userData.mobile = mobile;

    await userData.save();

    res.redirect('/profile');
  } catch (err) {
    // Handle specific errors or log them for debugging
    console.error(err);
    next(err);
  }
};






const passwordChange = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;
    const currentPassword = req.body.currentPassword;

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if a new password is provided and it matches the confirm password
    if (newPassword && newPassword === confirmPassword) {
      // Check if the current password matches
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
      const isSamePassword = await bcrypt.compare(newPassword, userData.password);

      if (!isCurrentPasswordValid) {
        // Return JSON response for the client
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      if (isSamePassword) {
        // Return JSON response for the client
        return res.status(400).json({ error: 'New password and old password are the same' });
      }

      // Hash and update the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      userData.password = hashedPassword;

      await userData.save();

      // Return JSON response for the client
      return res.json({ success: true });
    } else {
      // Return JSON response for the client
      return res.status(400).json({ error: 'New password and confirm password do not match' });
    }
  } catch (err) {
    // Handle specific errors or log them for debugging
    console.error(err);
    next(err);
  }
};






const addAddress = async (req, res, next) => {
  try {
    // console.log('Reached addAddress route');

    const userId = req.session.user_id;
    // console.log('UserId:', userId);

    const address = await Address.find({ user_id: userId });
    // console.log('Address:', address);

    if (address.length > 0) {
      const updateResult = await Address.updateOne(
        { user_id: userId },
        {
          $push: {
            address: {
              fullname: req.body.fullname,
              mobile: req.body.mobile,
              // email: req.body.email,
              housename: req.body.housename,
              pin: req.body.pin,
              city: req.body.city,
              district: req.body.district,
              state: req.body.state
            }
          }
        }
      );

      // console.log('Update Result:', updateResult);
    } else {
      const newAddress = new Address({
        user_id: userId,
        address: [{
          fullname: req.body.fullname,
          mobile: req.body.mobile,
          // email: req.body.email,
          housename: req.body.housename,
          pin: req.body.pin,
          city: req.body.city,
          district: req.body.district,
          state: req.body.state
        }]
      });

      const saveResult = await newAddress.save();
      console.log('Save Result:', saveResult);
    }

    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
}






const editAddressPage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const usersData = await takeUserData(userId);
    const addressId = req.params.addressId;

    // Fetch the user's address data
    const address = await Address.findOne({ user_id: userId });

    console.log('Address data:', address);
    console.log('Address ID:', addressId);


    if (usersData && address) {
      res.render('editaddress', { users: usersData, address: address, addressId: addressId });
    } else {
      console.log('User Data or Address is null or undefined');
      res.redirect('/profile');
    }
  } catch (error) {
    console.log(error);
    res.redirect('/profile');
  }
};





const editAddress = async (req, res) => {
  try {
    console.log('Edit Address Page accessed');
    const userId = req.session.user_id;
    const addressId = req.body.addressId; // Retrieve addressId from the request body its passing as hidden in form

    // Fetch the existing address data
    const existingAddress = await Address.findOne({ user_id: userId, 'address._id': addressId });

    if (existingAddress) {
      // Find the specific address within the user's addresses
      const targetAddress = existingAddress.address.find(addressItem => addressItem._id.toString() === addressId);

      if (targetAddress) {
        // Update the address fields based on the form data
        targetAddress.fullname = req.body.fullname;
        targetAddress.mobile = req.body.mobile;
        targetAddress.housename = req.body.housename;
        targetAddress.city = req.body.city;
        targetAddress.state = req.body.state;
        targetAddress.district = req.body.district;
        targetAddress.pin = req.body.pin;
        // Add other fields as needed

        // Save the updated address data
        await existingAddress.save();

        res.redirect('/profile'); // Redirect to profile after successful update
      } else {
        console.log('Address not found for user');
        res.redirect('/profile'); // Redirect to profile if address data not found
      }
    } else {
      console.log('User not found or address not found for user');
      res.redirect('/profile'); // Redirect to profile if user or address data not found
    }
  } catch (error) {
    console.log(error);
    res.redirect('/profile'); // Redirect to profile in case of an error
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const userId = req.session.user_id;

    console.log('UserID:', userId);
    console.log('AddressID:', addressId);

    // Update the user's address by pulling the specified addressId
    const result = await Address.updateOne(
      { user_id: userId },
      { $pull: { address: { _id: addressId } } }
    );

    console.log('Update Result:', result);

    if (result.matchedCount > 0) {
      // Send a success response and redirect to /profile

      res.redirect('/profile');
    } else {
      // Send an error response if the address wasn't found
      res.status(404).json({ message: 'Address not found', remove: 0 });
    }
  } catch (error) {
    console.error('An error occurred while deleting the address', error);
    res.status(500).json({ message: 'Error deleting the address', remove: 0 });
  }
};





const shopLoad = async (req, res) => {
  try {
    const { search, category: selectedCategory } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;

    // Fetch categories
    const categories = await Category.find({ is_listed: true });

    // Construct the filter criteria based on search and category
    const filterCriteria = {
      is_listed: true,
    };

    if (search) {
      filterCriteria.$or = [
        { product_name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { category: { $regex: '.*' + search + '.*', $options: 'i' } },
      ];
    }

    if (selectedCategory) {
      filterCriteria.category = { $regex: '.*' + selectedCategory + '.*', $options: 'i' };
    }

    // Fetch products based on search, filter, and pagination
    const products = await Product.find(filterCriteria)
      .skip((page - 1) * limit)
      .limit(limit);

    const count = await Product.find(filterCriteria).countDocuments();

    const totalPages = Math.ceil(count / limit);

    res.render('shop', {
      categories,
      products,
      search,
      selectedCategory,
      currentPage: page,
      totalPages,
      user: req.session.user_id,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};


//products details page

const shopdetailsLoad = async (req, res) => {
  try {
    // Assuming the product ID is provided in the request parameters
    const productId = req.params.productId;

    // Fetch the product details based on productId
    const product = await Product.findById(productId);

    // Render the shopdetails template with the product data
    res.render('shopdetails', { product, user: req.session.user_id });
  } catch (error) {
    console.log(error.message);
    // Handle errors, e.g., render an error page
    res.render('error', { error: 'Product not found' });
  }
};



const addToCart = async (req, res) => {
  try {
    if (req.session.user_id) {
      const productId = req.body.id;
      const userId = req.session.user_id;

      console.log('Received productId:', productId);

      // Fetch user details
      const userData = await userModel.findById(userId);
      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Fetch product details
      const productData = await Product.findById(productId);
      if (!productData) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if the product is out of stock
      if (productData.stock <= 0) {
        return res.json({ outofstock: true });
      }

      // Fetch user's cart
      let userCart = await Cart.findOne({ user: userId });

      if (!userCart) {
        // If the user doesn't have a cart, create a new one
        userCart = new Cart({ user: userId, products: [] });
      }

      // Check if the product is already in the cart
      const existingProductIndex = userCart.products.findIndex(product => String(product.productId) === String(productId));

      if (existingProductIndex !== -1) {
        // If the product is in the cart, update the quantity
        const existingProduct = userCart.products[existingProductIndex];

        console.log('Existing Quantity:', existingProduct.quantity);
        if (productData.stock <= existingProduct.quantity) {
          console.log('Out of stock');
          return res.json({ outofstock: true });
        } else {
          existingProduct.quantity += 1;
        }
      } else {
        // If the product is not in the cart, add it
        userCart.products.push({ productId: productId, price: productData.price, quantity: 1 });
      }

      // Save the updated cart
      await userCart.save();

      res.json({ success: true });
    } else {
      res.json({ loginRequired: true });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred' });
  }
};


const getCartProducts = async (req, res) => {
  try {
    if (req.session.user_id) {
      const userId = req.session.user_id;
      const cartData = await Cart.findOne({ user: userId }).populate("products.productId");

      if (cartData && cartData.products.length > 0) {
        let total = 0;

        // Calculate total
        cartData.products.forEach((product) => {
          total += product.quantity * product.productId.product_price;
        });

        // Render the 'cart' view with the calculated total
        res.render('cart', { user: req.session.user_id, userId: userId, cart: cartData.products, total: total });
      } else {
        // If the cart is empty, render 'cart' view with an empty cart array
        res.render('cart', { user: req.session.user_id, cart: [], total: 0 });
      }
    } else {
      // If user is not logged in, render 'login' view with an error message
      // res.render('login', { errors: "Please log in to view your cart" });
      // res.redirect('/login');
      res.redirect('/login?errors=Please log in to view');

    }
  } catch (error) {
    // Handle any errors by rendering the 'error' view
    console.log(error);
    res.render('error', { error: 'An error occurred' });
  }
};


const cartQuantity = async (req, res) => {
  try {
    const number = parseInt(req.body.count);
    const proId = req.body.product;
    const userId = req.body.user;
    const count = number;

    const cartData = await Cart.findOne(
      { user: new ObjectId(userId), "products.productId": new ObjectId(proId) },
      { "products.productId.$": 1, "products.quantity": 1 }
    );

    const [{ quantity }] = cartData.products;

    const productData = await Product.findById(proId);

    // Check if the new quantity after the update will be greater than or equal to 1
    if (quantity + count >= 1) {
      if (productData.stock < quantity + count) {
        res.json({ success: false, message: "Quantity exceeds available stock" });
      } else {
        const datat = await Cart.updateOne(
          { user: userId, "products.productId": proId },
          {
            $inc: { "products.$.quantity": count },
          }
        );
        res.json({ changeSuccess: true });
      }
    } else {
      res.json({ success: false, message: "Quantity cannot be less than 1" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred' });
  }
};


const removeProductRouteHandler = async (req, res) => {
  try {
    console.log('apicall');
    const proId = req.body.product;
    console.log("productiddd ", proId);
    const user = req.session.user_id;
    const userId = user._id;

    // Find the user's cart and update it to remove the specified product
    const cartData = await Cart.findOneAndUpdate(
      { "products.productId": proId },
      { $pull: { products: { productId: proId } } }
    );

    // Check if the product was found and removed
    if (cartData) {
      res.json({ success: true });
    } else {
      res.json({ error: 'Product not found in the cart' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
};






const loadCheckout = async (req, res, next) => {
  try {
    console.log(req.query)
    let date = new Date();
    const userId = req.session.user_id;

    // Fetch user data
    const userData = await userModel.findById(userId);

    // Fetch cart details
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'products.productId',
      model: 'product', // Replace with the actual model name for your products
    });

    const coupons = await Coupon.find()

    if (!cart || cart.products.length === 0) {
      // Redirect to the cart page
      return res.redirect('/view-cart');
    }

    const stockExceeded = cart.products.some((product) => {
      return product.quantity > product.productId.stock;
    });

    if (stockExceeded) {
      // Redirect or render an error page indicating stock exceeded
      // You can customize this part based on your application flow
      return res.redirect('/view-cart'); // or render an error page
    }

    // Fetch user addresses
    const addresses = await Address.findOne({ user_id: userId });

    let total = 0;

    // Calculate total
    cart.products.forEach((product) => {
      total += product.quantity * product.productId.product_price;
    });

    console.log(req.query.appliedCoupon)
    let appliedCoupon = null;
    let discount = null
    if (req.query.appliedCoupon) {
      appliedCoupon = req.query.appliedCoupon
      const coupon = await Coupon.findOne({ code: appliedCoupon });
      discount = coupon.discountPercentage
    }

    let error = null;

    if (req.query.error) {
      error = req.query.error

    }

    const userAddresses = addresses ? addresses.address : null;


    res.render('checkout', { cart, addresses: userAddresses, total, userData, appliedCoupon, discount, error, updatedTotal: req.query.updatedTotal,coupons });
  } catch (err) {
    console.error('Error in loadCheckout:', err);
    next(err);
  }
};





const applyCoupon = async (req, res, next) => {
  try {
    let date = new Date();
    const userId = req.session.user_id;

    // Fetch cart details
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'products.productId',
      model: 'product',
    });

    let total = 0;

    // Calculate total
    cart.products.forEach((product) => {
      total += product.quantity * product.productId.product_price;
    });

    const couponCode = req.body.couponCode;
    req.session.couponCode = couponCode;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });

      if (coupon && coupon.startDate <= date && date <= coupon.expireDate) {
        // Check if the user has already used the coupon
        if (coupon.user.includes(userId)) {
          console.log('User has already used this coupon.');
          return res.redirect('/checkout?error=already-used-coupon');
        }

        // Coupon is valid, apply discount to the total
        const discountAmount = (total * coupon.discountPercentage) / 100;
        total -= discountAmount;
        req.session.total=total





        // Redirect back to the checkout page with the updated total
        return res.redirect(`/checkout?appliedCoupon=${couponCode}&updatedTotal=${total}`);
      } else {
        // Invalid coupon code or expired
        console.log('Invalid coupon code or expired.');
        return res.redirect('/checkout?error=invalid-coupon');
      }
    }

    // Redirect back to the checkout page without applying a coupon
    res.redirect('/checkout');
  } catch (err) {
    console.error('Error applying coupon:', err);

    // Redirect back to the checkout page with an error message
    res.redirect('/checkout?error=apply-coupon-error');
  }
};

const removeCoupon = (req, res) => {
  try {
    // Remove the applied coupon from the session
    delete req.session.couponCode;
    delete req.session.total

    // Redirect back to the checkout page
    res.redirect('/checkout?couponRemoved=true');
  } catch (err) {
    console.error('Error removing coupon:', err);

    // Redirect back to the checkout page with an error message
    res.redirect('/checkout?error=remove-coupon-error');
  }
};







const addShippingAddress = async (req, res, next) => {
  try {
    // Check if user is logged in
    if (!req.session.user_id) {
      return res.status(401).send('User not authenticated');
    }

    const userId = req.session.user_id;

    const address = await Address.findOne({ user_id: userId });

    if (address) {
      // Update existing address
      const updateResult = await Address.updateOne(
        { user_id: userId },
        {
          $push: {
            address: {
              fullname: req.body.fullname,
              mobile: req.body.mobile,
              housename: req.body.housename,
              pin: req.body.pin,
              city: req.body.city,
              district: req.body.district,
              state: req.body.state
            }
          }
        }
      );
    } else {
      // Create new address
      const newAddress = new Address({
        user_id: userId,
        address: [{
          fullname: req.body.fullname,
          mobile: req.body.mobile,
          housename: req.body.housename,
          pin: req.body.pin,
          city: req.body.city,
          district: req.body.district,
          state: req.body.state
        }]
      });

      const saveResult = await newAddress.save();
      // console.log('Save Result:', saveResult);
    }

    // Redirect to the checkout success or profile page
    res.redirect('/checkout');
  } catch (err) {
    // Handle errors
    next(err);
  }
};



const editAddressPagecheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const usersData = await takeUserData(userId);
    const addressId = req.params.addressId;

    // Fetch the user's address data
    const address = await Address.findOne({ user_id: userId });

    console.log('Address data:', address);
    console.log('Address ID:', addressId);

    if (usersData && address) {
      res.render('editaddresscheckout', { users: usersData, address: address, addressId: addressId });
    } else {
      console.log('User Data or Address is null or undefined');
      res.redirect('/checkout'); // Redirect to checkout page if user data or address data not found
    }
  } catch (error) {
    console.log(error);
    res.redirect('/checkout'); // Redirect to checkout page in case of an error
  }
};

const editAddresscheckout = async (req, res) => {
  try {
    console.log('Edit Address Checkout Page accessed');
    const userId = req.session.user_id;
    const addressId = req.body.addressId; // Retrieve addressId from the request body, it's passing as hidden in the form

    // Fetch the existing address data
    const existingAddress = await Address.findOne({ user_id: userId, 'address._id': addressId });

    if (existingAddress) {
      // Find the specific address within the user's addresses
      const targetAddress = existingAddress.address.find(addressItem => addressItem._id.toString() === addressId);

      if (targetAddress) {
        // Update the address fields based on the form data
        targetAddress.fullname = req.body.fullname;
        targetAddress.mobile = req.body.mobile;
        targetAddress.housename = req.body.housename;
        targetAddress.city = req.body.city;
        targetAddress.state = req.body.state;
        targetAddress.district = req.body.district;
        targetAddress.pin = req.body.pin;
        // Add other fields as needed

        // Save the updated address data
        await existingAddress.save();

        res.redirect('/checkout'); // Redirect to checkout page after successful update
      } else {
        console.log('Address not found for user');
        res.redirect('/checkout'); // Redirect to checkout page if address data not found
      }
    } else {
      console.log('User not found or address not found for user');
      res.redirect('/checkout'); // Redirect to checkout page if user or address data not found
    }
  } catch (error) {
    console.log(error);
    res.redirect('/checkout'); // Redirect to checkout page in case of an error
  }
};





const instance = new Razorpay({
  key_id: 'rzp_test_fZkpvgMYwl1OFW',
  key_secret: '7qPA2dWay5GP1spvWde4dVy8',
});


const calculateTotalPrice = async (userId) => {
  try {
    const cart = await Cart.findOne({ user: userId }).populate(
      'products.productId'
    );

    if (!cart) {
      console.log('User does not have a cart.');
      return 0; // Return 0 if the user doesn't have a cart
    }

    let totalPrice = 0;
    for (const cartProduct of cart.products) {
      const { productId, quantity } = cartProduct;
      const productSubtotal = productId.product_price * quantity; // Update to use the correct field
      totalPrice += productSubtotal;
    }

    return totalPrice;
  } catch (error) {
    console.error('Error calculating total price:', error.message);
    return 0;
  }
};













const placeOrder = async (req, res) => {
  try {
    console.log('Request Body:', req.body);
    const addressId = req.body.address;
    const paymentType = req.body.payment;

    // Check if addressId and paymentType are provided
    if (!addressId || !paymentType) {
      console.log('Invalid address or payment type');
      return res.status(400).json({ error: "Invalid address or payment type" });
    }

    const userId = req.session.user_id;
    const cartDetails = await Cart.findOne({ user: userId });

    const userAddrs = await Address.findOne({ user_id: userId });

    if (!userAddrs || !userAddrs.address || userAddrs.address.length === 0) {
      console.log('User addresses not found');
      return res.status(400).json({ error: "User addresses not found" });
    }

    const shipAddress = userAddrs.address.find((address) => {
      return address._id.toString() === addressId.toString();
    });

    if (!shipAddress) {
      console.log('Address not found');
      return res.status(400).json({ error: "Address not found" });
    }

    const cartProducts = cartDetails.products.map((productItem) => ({
      productId: productItem.productId,
      quantity: productItem.quantity,
      orderStatus: "Placed",
      // returnOrder: {
      //   status: "none",
      //   reason: "none",
      // },
      returnOrder: {
        status: false,
        returnStatus: "Placed",
      },
    }));
    let total;
    if (req.session.couponCode) {
      total = req.session.total;

      // Clear the applied coupon from the session once used
      delete req.session.couponCode;
      delete req.session.total;

    } else {
      // If no updated total in session, calculate it
      total = await calculateTotalPrice(userId);
    }

    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 7);


    const order = new Order({
      user: userId,
      cart: {
        user: userId,
        products: cartProducts,
      },
      deliveryAddress: {
        fullname: shipAddress.fullname,
        mobile: shipAddress.mobile,
        housename: shipAddress.housename,
        city: shipAddress.city,
        state: shipAddress.state,
        district: shipAddress.district,
        pin: shipAddress.pin,
      },
      paymentOption: paymentType,
      totalAmount: total,
      orderDate: new Date(),
      expectedDelivery: deliveryDate,
      

    });

    let placeorder;

    if (paymentType === "COD" || paymentType === 'Wallet') {
      
    
        if (paymentType === 'Wallet') {
          console.log('Entered wallet');
          const userdetails = await userModel.findOne({ _id: req.session.user_id });
          console.log(userdetails.wallet)
          console.log(total)
          if (userdetails.wallet < total) {
            console.log('Insufficient wallet balance');
            return res.status(400).json({ error: "Insufficient wallet balance" });
          }
    
          const walletHistory = {
            date: new Date(),
            amount: total,
            description: 'Order placed using Wallet',
            transactionType: 'Debit',
          };
    
          await userModel.findByIdAndUpdate(
            { _id: userId },
            {
              $inc: {
                wallet: -total
              },
              $push: {
                walletHistory
              }
            }
          );
          for (const item of cartDetails.products) {
            const productId = item.productId._id;
            const quantity = parseInt(item.quantity, 10);
          // Update stock only if the wallet payment is successful
          await Product.findByIdAndUpdate(
            { _id: productId },
            { $inc: { stock: -quantity } }
          );
          }
        } else {
          console.log('Entered COD');

          for (const item of cartDetails.products) {
            const productId = item.productId._id;
            const quantity = parseInt(item.quantity, 10);
    
          // Update stock only if the COD payment is successful
          await Product.findByIdAndUpdate(
            { _id: productId },
            { $inc: { stock: -quantity } }
          );
        } 
      }
    
      console.log('Order placed successfully');
      order.status=true
      placeorder = await order.save();
    
      res.status(200).json({ placeorder, message: "Order placed successfully" });
    
      console.log('Before cart clearing');
    
      // Clear the user's cart after a successful order placement
      await Cart.findOneAndDelete({ user: userId });
      console.log('After cart clearing');
    }
    
     
    else if (paymentType === "Razorpay") {
      console.log('Entered Razorpay block');
    
      placeorder = await order.save();
      const orderId = placeorder._id;
    
      const options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
    
      instance.orders.create(options, async function (err, order) {
        if (err) {
          console.error('Razorpay order creation failed:', err);
          return razorPaymentFailed(res, "Razorpay order creation failed");
        }
    
        console.log('Razorpay Order:', order);
    
        for (const item of cartDetails.products) {
          const productId = item.productId._id;
          const quantity = parseInt(item.quantity, 10);
    
          // Update stock
          await Product.findByIdAndUpdate(
            { _id: productId },
            { $inc: { stock: -quantity } }
          );
        }
    
        // Handle the Razorpay order response here
        res.status(200).json({ order });
      });
    }
    

  } catch (error) {
    console.error('An error occurred:', error.message);
    res.status(500).json({ error: "An error occurred" });
  }
};






// Function to handle the Razorpay payment response verification
// const verifyPayment = async (req, res) => {
//   try {
//     console.log("watg3t")
//     console.log(req.body)
//     const cartData = await Cart.findOne({ user: req.session.user_id });
//     const products = cartData.products;
//     const details = req.body;
//     const hmac = crypto.createHmac("sha256", instance.key_secret);

//     hmac.update(
//       details.payment.razorpay_order_id +
//       "|" +
//       details.payment.razorpay_payment_id
//     );
//     const hmacValue = hmac.digest("hex");

//     if (hmacValue === details.payment.razorpay_signature) {
//       for (let i = 0; i < products.length; i++) {
//         const productId = products[i].productId;
//         const quantity = products[i].quantity;
//         await Product.findByIdAndUpdate(
//           { _id: productId },
//           { $inc: { quantity: -quantity } }
//         );
//       }
//       await Order.findByIdAndUpdate(
//         { _id: details.order.receipt },
//         { $set: { 'products.$[].paymentStatus': 'Success' } }
//       );

//       await Order.findByIdAndUpdate(
//         { _id: details.order.receipt },
//         { $set: { paymentId: details.payment.razorpay_payment_id } }
//       );
//       await Cart.deleteOne({ user: req.session.user_id });
//       const orderid = details.order.receipt;

//       res.json({ codsuccess: true, orderid });
//     } else {
//       await Order.findByIdAndRemove({ _id: details.order.receipt });
//       res.json({ success: false });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error });
//   }
// };

const verifyPayment = async (req, res) => {
  try {
    console.log("Received payment verification request");
    console.log("Request Body:", req.body);

    const cartData = await Cart.findOne({ user: req.session.user_id });
    const details = req.body;

    // Verify the Razorpay signature
    const hmac = crypto.createHmac("sha256", instance.key_secret);
    hmac.update(details.payment.razorpay_order_id + "|" + details.payment.razorpay_payment_id);
    const hmacValue = hmac.digest("hex");

    if (hmacValue !== details.payment.razorpay_signature) {
      // Signature verification failed
      console.log("Signature verification failed");
      await Order.findByIdAndRemove({ _id: details.order.receipt });
      return res.json({ success: false, message: "Signature verification failed" });
    }

    // Signature verification successful
    console.log("Signature verification successful");

    // Update product quantities
    for (const product of cartData.products) {
      await Product.findByIdAndUpdate(
        { _id: product.productId },
        { $inc: { quantity: -product.quantity } }
      );
    }

    // Update order payment status and payment ID
    const orderId = details.order.receipt;
    await Order.findByIdAndUpdate(
      orderId,
      { $set: { 'products.$[].paymentStatus': 'Success', paymentId: details.payment.razorpay_payment_id } }
    );

    // Clear the user's cart
    await Cart.deleteOne({ user: req.session.user_id });

    // Set the order status to true for successful payment
    await Order.findByIdAndUpdate(orderId, { $set: { status: true } });

    console.log("Payment successful");
    res.json({ codsuccess: true, orderid: orderId });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ error });
  }
};






const orderPlaced = async (req, res) => {
  try {
    res.render('orderplaced'); // No need to pass any variables if there's no error
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'Failed to render orderplaced template' });
  }
};


const loadaddwallet = async (req, res) => {
  try {
    res.render('wallet'); // No need to pass any variables if there's no error
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'Failed to render orderplaced template' });
  }
};
const loadwalletHistory = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Render the wallet history template
    res.render('walletHistory', { walletHistory: user.walletHistory });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'Failed to render orderplaced template' });
  }
};



const addMoneyWallet = async (req, res) => {
  try {
    console.log("monry comong");

    const { amount } = req.body
    console.log('amount', amount);
    const id = crypto.randomBytes(8).toString('hex')
    console.log(id);
    var options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: "" + id
    }
    console.log('//', options);

    instance.orders.create(options, (err, order) => {
      console.log('///orr', order);
      if (err) {
        console.log('err');
        res.json({ status: false })
      } else {
        console.log('stts');
        res.json({ status: true, order: order })
      }

    })

  } catch (error) {
    console.log(error);
  }
}


const verifyWalletpayment = async (req, res) => {
  try {

    console.log("entered into post verify wallet payment");


    const userId = req.session.user_id

    const body = req.body;
    console.log("data", body)
    const amount = parseInt(body.order.amount) / 100;
    let hmac = crypto.createHmac('sha256', "7qPA2dWay5GP1spvWde4dVy8")


    hmac.update(
      body.payment.razorpay_order_id + '|' + body.payment.razorpay_payment_id
    )
    hmac = hmac.digest('hex')
    if (hmac == body.payment.razorpay_signature) {

      const walletHistory = {
        date: new Date(),
        description: 'Deposited via Razorpay',
        transactionType: 'Credit',
        amount: amount,
      }
      await userModel.findByIdAndUpdate(
        { _id: userId },
        {
          $inc: {
            wallet: amount 
          },
          $push: {
            walletHistory
          }
        }
      );

      const updatedUser = await userModel.findById(userId);
      console.log('udddd')
      res.json({ status: true, wallet: updatedUser.wallet })
    } else {
      res.json({ status: false })
    }


  } catch (error) {
    console.log(error);
  }
}

const loadWishlist = async (req, res,next) => {
  try {
      
      const wishlist = await Wishlist.findOne({ user: req.session.userid }).populate('products.productId')
      res.render('wishlist', { session: req.session.userid, wish: wishlist })

  } catch (err) {
      next(err)
  }
}

const addWishlist=async(req,res,next)=>{
  try {
      const product = req.body.proId
      const userId = req.session.userid

      if(userId===undefined){
          res.json({ NoUser: true})
      }

      const wishData = await Wishlist.findOne({ user: userId })

      if (wishData) {
          
          const existProduct = await Wishlist.findOne({ user: userId, 'products.productId': product })
          console.log(existProduct);
        
          if (existProduct) {
              res.json({ success: false, message: 'Product already exists' })
             

          } else {
              await Wishlist.findOneAndUpdate({ user: userId }, { $push: { products: { productId: product } } })
            
              res.json({ success: true })
          }

      } else {

          const wishlist = new Wishlist({
              user: userId,
              products: [{
                  productId: product
              }]
          })
             console.log(wishlist);
          const newWish = await wishlist.save()
        
        
          if (newWish) {
              res.json({ success: true })
          } else {
              res.json({ success: false, message: 'Something went wrong' })
          }
      }

  } catch (err) {
      next(err)
  }
}



const deleteWishlist = async (req , res , next) => {
  try {

      const productId = req.body.proId
      const wishData = await Wishlist.findOne({ user : req.session.userid })
      console.log(wishData);
      console.log(wishData.products.length);

      if(wishData.products.length === 1) {
          await Wishlist.deleteOne({ user : req.session.userid})
          
          res.json({ success : true })
      }else{
          await Wishlist.findOneAndUpdate({ user : req.session.userid } , {
              $pull : { products : { productId : productId }}
          })

          res.json({ success : true })
      }
      
  } catch (err) {
      next(err)
  }
}


module.exports = {
  homeLoad,

  loadSignup,
  loadOtp,
  sendOtp,
  resendOtp,
  verifyOtp,

  loginLoad,
  verifyLogin,
  userLogout,

  forgotLoad,
  forgotVerify,
  resetpasswordLoad,
  resetPassword,

  profileLoad,
  invoiceDownload,
  orderDetails,
  cancelOrderAjax,
  returnOrderAjax,
  updateProfile,
  passwordChange,
  addAddress,
  editAddressPage,
  editAddress,
  deleteAddress,
  loadwalletHistory,
  loadaddwallet,
  addMoneyWallet,
  verifyWalletpayment,

  shopLoad,
  shopdetailsLoad,

  addToCart,
  getCartProducts,
  cartQuantity,
  removeProductRouteHandler,

  loadCheckout,
  addShippingAddress,
  editAddressPagecheckout,
  editAddresscheckout,

  applyCoupon,
  removeCoupon,

  placeOrder,
  verifyPayment,
  orderPlaced,

  loadWishlist,
  addWishlist,
  deleteWishlist

  
  




}