const userModel = require("../model/userModel")

const Category = require('../model/productModel').category;
const Product = require('../model/productModel').product;
const Cart=require('../model/cartModel')
const { ObjectId } = require('mongoose').Types;

const Address = require("../model/addressModel")
const Order = require("../model/orderModel")

const validateAddress = require('../middlewares/validation');

const bcrypt=require('bcrypt');
const { name } = require('ejs');
const otpGenerator=require("otp-generator")
const nodemailer=require("nodemailer")
const path=require("path")
const randomstring= require('randomstring')

//hashing

const securePassword=async(password)=>{
    try {
       const passwordHash= await bcrypt.hash(password,10)
       return passwordHash
    } catch (error) {
        console.log(error.message)
    }
}

//home

const homeLoad=async(req,res)=>{
    try {
        res.render('home',{ user: req.session.user_id })
    } catch (error) {
        console.log(error.message )
    }
}

//registration

          //load registration

const loadSignup=async(req,res)=>{
    try{
        res.render('registration')
    }
    catch(error){
       console.log(error.message)
    }
}
   
          //load otp

const loadOtp=async(req,res)=>{
    try{
        res.render('otp')
    }
    catch(error){
       console.log(error.message)
    }
}
 

     //otp sending..
const sendOtp = async (req, res) => {
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

    //otp resend function

const resendOtp = async (req, res) =>{
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


        //verifying otp and adding user to database

const verifyOtp = async (req, res) => {
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


  //loginload

const loginLoad=async(req,res)=>{
  try {
    const errorMessage = req.query.errors;

      res.render('login',{ errors: errorMessage })
  } catch (error) {
      console.log(error.message )
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
          if (userData.is_verified === 1) {
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

const userLogout=async(req,res)=>{
  try {
      req.session.destroy()
      res.redirect('/')
  } catch (error) {
      console.log(error.message)
  }
}

//forgot

const forgotLoad=async(req,res)=>{
    try {
        res.render('forgot')
    } catch (error) {
        console.log(error.message )
    } 
  }
     //for sending  mail function
  const resetPasswordMail = async (username,email,token)=>{
    try {
      const transporter = nodemailer.createTransport({
        host:'smtp.gmail.com',
        port:587,
        secure:false,
        requireTLS:true,
        auth:{
          user: 'csa20218042@gmail.com',
          pass: 'vigb bpay kixl wbng',
        }
      })
  
      const mailOptions = {
        from:'csa20218042@gmail.com',
        to:email,
        subject:"For Reset Password",
        html: `<p> Hi, ${username}, please click here to <a href="http://localhost:3000/resetpassword?token=${token}"> Reset </a> your password</p>`
      }
  
      transporter.sendMail(mailOptions,function(error,info){
        if(error){
          console.log(error);
        }else{
          console.log("Email Has been Sent:-",info,response);
        }
      })
    } catch (error) {
      console.log(error);
    }
  }
  
  const forgotVerify = async (req,res)=>{
    try {
      const email = req.body.email
      const userData = await userModel.findOne({email:email})
  
      if(userData){
        if(userData.isVerified===false){
          res.render('forgot',{message:"Please verify your mail"})
        }else{
          const randomString = randomstring.generate()
          const updatedData = await userModel.updateOne({email:email},
            {$set:{token:randomString}})
  
            resetPasswordMail(userData.username,userData.email,randomString)
            res.render('forgot',{message:"Please Check Your Mail to Reset Your Password"})
        }
      }else{
        res.render('forgot',{message:"User email is Incorrect"})
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


// const profileLoad = async (req, res) => {
//   try { 
//     const userId = req.session.user_id;

//     // Fetch user data 
//     const userData = await takeUserData(userId);

//     // Fetch user address data
//     const addressData = await Address.findOne({ user_id: userId });

//     // console.log('User Data:', userData);
//     // console.log('Address Data:', addressData);

//     // Check if userData is not null or undefined
//     if (userData) {
//       res.render('profile', { users: userData, user: userId, address: addressData ? addressData.address : null });
//     } else {
//       console.log('User Data is null or undefined');
//       res.render('profile', { users: null, user: userId });
//     }
//   } catch (error) {
//     console.log(error);
//     res.render('profile', { users: null, user: req.session.user_id, address: null, error: 'Error fetching user data' });
//   }
// }

// const profileLoad = async (req, res) => {
//   try { 
//     // Check if there is an active login session
//     if (!req.session.user_id) {
//       return res.redirect('/login?errors=Please log in to view');
//     }

//     const userId = req.session.user_id;

//     // Fetch user data 
//     const userData = await takeUserData(userId);

//     // Fetch user address data
//     const addressData = await Address.findOne({ user_id: userId });

//     // console.log('User Data:', userData);
//     // console.log('Address Data:', addressData);

//     // Check if userData is not null or undefined
//     if (userData) {
//       res.render('profile', { users: userData, user: userId, address: addressData ? addressData.address : null });
//     } else {
//       console.log('User Data is null or undefined');
//       res.render('profile', { users: null, user: userId });
//     }
//   } catch (error) {
//     console.log(error);
//     res.render('profile', { users: null, user: req.session.user_id, address: null, error: 'Error fetching user data' });
//   }
// }

// const profileLoad = async (req, res) => {
//   try {
//     // Check if there is an active login session
//     if (!req.session.user_id) {
//       return res.redirect('/login?errors=Please log in to view');
//     }

//     const userId = req.session.user_id;

//     // Fetch user data
//     const userData = await takeUserData(userId);

//     // Fetch user address data
//     const addressData = await Address.findOne({ user_id: userId });

//     // Fetch user orders
//     const orders = await Order.find({ user: userId }).sort({ orderDate: -1 });

//     // Check if userData is not null or undefined
//     if (userData) {
//       res.render('profile', { users: userData, user: userId, address: addressData ? addressData.address : null, orders });
//     } else {
//       console.log('User Data is null or undefined');
//       res.render('profile', { users: null, user: userId, orders: [] });
//     }
//   } catch (error) {
//     console.log(error);
//     res.render('profile', { users: null, user: req.session.user_id, address: null, orders: [], error: 'Error fetching user data' });
//   }
// };

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

    // Fetch user orders
    const orders = await Order.find({ user: userId }).sort({ orderDate: -1 });

    // Fetch user cart
    const cart = await Cart.findOne({ user: userId }).populate('products.productId');

    // Check if userData is not null or undefined
    if (userData) {
      res.render('profile', { users: userData, user: userId, address: addressData ? addressData.address : null, orders, cart });
    } else {
      console.log('User Data is null or undefined');
      res.render('profile', { users: null, user: userId, orders: [], cart: null });
    }
  } catch (error) {
    console.log(error);
    res.render('profile', { users: null, user: req.session.user_id, address: null, orders: [], cart: null, error: 'Error fetching user data' });
  }
};

// const profileLoad = async (req, res) => {
//   try {
//     // Check if there is an active login session
//     if (!req.session.user_id) {
//       return res.redirect('/login?errors=Please log in to view');
//     }

//     const userId = req.session.user_id;

//     // Fetch user data
//     const userData = await takeUserData(userId);

//     // Fetch user address data
//     const addressData = await Address.findOne({ user_id: userId });

//     // Fetch user orders
//     const orders = await Order.find({ user: userId }).sort({ orderDate: -1 });

//     // Fetch user cart
//     const cart = await Cart.findOne({ user: userId }).populate('products.productId');

//     // Check if userData is not null or undefined
//     if (userData) {
//       res.render('profile', { users: userData, user: userId, address: addressData ? addressData.address : null, orders, cart, error: null });
//     } else {
//       console.log('User Data is null or undefined');
//       res.render('profile', { users: null, user: userId, orders: [], cart: null, error: null });
//     }
//   } catch (error) {
//     console.log(error);
//     res.render('profile', { users: null, user: req.session.user_id, address: null, orders: [], cart: null, error: 'Error fetching user data' });
//   }
// };


// const orderDetails = async (req, res) => {
//   try {
//     const orderId = req.params.orderId;

//     // Fetch order details with populated references
//     const order = await Order.findById(orderId)
//       .populate({
//         path: 'cart',
//         populate: {
//           path: 'products.productId',
//           model: 'product',
//         },
//       })
      

//     // Check if the order exists
//     if (!order) {
//       return res.status(404).render('error', { message: 'Order not found' });
//     }

//     // Render order details view
//     res.render('orderdetails', { order });
//   } catch (error) {
//     console.error(error);
//     res.status(500).render('error', { message: 'Error fetching order details' });
//   }
// };

// const orderDetails = async (req, res) => {
//   try {
//     const orderId = req.params.orderId;

//     // Fetch order details with populated references

     

//     // Check if the order exists
//     if (!order) {
//       return res.status(404).render('error', { message: 'Order not found' });
//     }

//     // Render order details view
//     res.render('orderdetails', { order });
//   } catch (error) {
//     console.error(error);
//     res.status(500).render('error', { message: 'Error fetching order details' });
//   }
// };

// const orderDetails = async (req, res) => {
//   try {
//     const orderId = req.params.orderId;

//     // Fetch order details
//     const order = await Order.findById(orderId);

//     // Check if the order exists
//     if (!order) {
//       return res.status(404).render('error', { message: 'Order not found' });
//     }

//     // Fetch delivery address, cart, and products separately
//     const address = await Address.findOne(
//       { user_id: order.user, 'address._id': order.deliveryAddress },
//       { 'address.$': 1 }
//     );
//     const product = await Order.findById(orderId).populate({
//       path: 'cart.products.productId',
//       model: 'product',
//     });

//     // Check if the address exists
//     if (!address || !address.address || address.address.length === 0) {
//       // Handle the case where the address is not found
//       console.log('Address not found');
//     } else {
//       // Access the address details
//       const specificAddress = address.address[0];

//       // Render order details view with order, address, and cart data
//       res.render('orderdetails', { order, address: specificAddress, cart });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).render('error', { message: 'Error fetching order details' });
//   }
// };


const orderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Fetch order details
    const order = await Order.findById(orderId);

    // Check if the order exists
    if (!order) {
      return res.status(404).render('error', { message: 'Order not found' });
    }

    // Fetch delivery address, cart, and products separately
    const address = await Address.findOne(
      { user_id: order.user, 'address._id': order.deliveryAddress },
      { 'address.$': 1 }
    );
    const orderWithProducts = await Order.findById(orderId).populate({
      path: 'cart.products.productId',
      model: 'product',
    });

    // Check if the address exists
    if (!address || !address.address || address.address.length === 0) {
      // Handle the case where the address is not found
      console.log('Address not found');
    } else {
      // Access the address and product details
      const specificAddress = address.address[0];
      const orderedProducts = orderWithProducts.cart.products;

      let total = 0;
      orderedProducts.forEach((product) => {
        total += product.quantity * product.productId.product_price;
      });

      // Render order details view with order, address, and product data
      res.render('orderdetails', { order, address: specificAddress, orderedProducts,total });
    }
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error fetching order details' });
  }
};


// const cancelOrder = async (req, res) => {
//   try {
//     const orderId = req.params.orderId;

//     // Find the order in the database
//     const order = await Order.findById(orderId);

//     // Check if the order exists
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }

//     // Check if the order is cancelable (e.g., status is 'Placed' or 'Shipped')
//     if (order.status !== 'Placed' && order.status !== 'Shipped') {
//       return res.status(400).json({
//         success: false,
//         message: 'Order cannot be canceled at this stage',
//       });
//     }

//     // Update the order status to 'Cancelled'
//     order.status = 'Cancelled';
//     await order.save();

//     res.status(200).json({
//       success: true,
//       message: 'Order canceled successfully',
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Failed to cancel the order' });
//   }
// };


const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Find the order in the database
    const order = await Order.findById(orderId);

    // Check if the order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if the order is cancelable (e.g., status is 'Placed' or 'Shipped')
    if (order.status !== 'Placed' && order.status !== 'Shipped') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be canceled at this stage',
      });
    }

    // Update the order status to 'Cancelled'
    order.status = 'Cancelled';
    await order.save();

    // Redirect to the same page with a confirmation message
    res.redirect(`/orderdetails/${orderId}?canceled=true`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to cancel the order' });
  }
};





const updateProfile = async (req, res, next) => {
  try {
    const userId = req.session.user_id;

    const username = req.body.username;
    const mobile = req.body.mobile;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;
    const currentPassword = req.body.currentPassword;

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).send('User not found');
    }

    // Validate other fields if needed

    // Check if a new password is provided and it matches the confirm password
    if (newPassword && newPassword === confirmPassword) {
      // Check if the current password matches
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);

      if (!isCurrentPasswordValid) {
        return res.status(400).send('Current password is incorrect');
      }

      // Hash and update the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      userData.password = hashedPassword;
    }

    // Update other user profile fields
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

// const addAddress = async (req, res, next) => {
//   try {
//     const isValid = validAddress(); // Validate the form data client-side

//     if (!isValid) {
//       // If validation fails, send back to the form with an error message
//       return res.render('yourFormPage', { error: 'Validation failed. Please check your input.' });
//     }

//     const userId = req.session.user_id;
//     const address = await Address.find({ user_id: userId });

//     if (address.length > 0) {
//       const updateResult = await Address.updateOne(
//         { user_id: userId },
//         {
//           $push: {
//             address: {
//               fullname: req.body.fullname,
//               mobile: req.body.mobile,
//               housename: req.body.housename,
//               pin: req.body.pin,
//               city: req.body.city,
//               district: req.body.district,
//               state: req.body.state,
//             },
//           },
//         }
//       );

//       // Handle updateResult as needed
//     } else {
//       const newAddress = new Address({
//         user_id: userId,
//         address: [
//           {
//             fullname: req.body.fullname,
//             mobile: req.body.mobile,
//             housename: req.body.housename,
//             pin: req.body.pin,
//             city: req.body.city,
//             district: req.body.district,
//             state: req.body.state,
//           },
//         ],
//       });

//       const saveResult = await newAddress.save();
//       // Handle saveResult as needed
//     }

//     return res.redirect('/profile');
//   } catch (err) {
//     return next(err);
//   }
// };





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

      // Update the user's address by pulling the specified addressId
      const result = await Address.updateOne(
          { user_id: userId },
          { $pull: { address: { _id: addressId } } }
      );

      if (result.ok === 1) {
          // Send a success response
          
          res.status(200).json({ message: 'Address deleted successfully' });
      } else {
          // Send an error response if the address wasn't found
          res.status(404).json({ message: 'Address not found' });
      }
  } catch (error) {
      console.error('An error occurred while deleting the address', error);
      res.status(500).json({ message: 'Error deleting the address' });
  }
};





//products page 

const shopLoad = async (req, res) => {
  try {
    const { search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;

    // Fetch categories
    const categories = await Category.find({ is_listed: true });

    // Fetch products based on search and pagination
    let products;
    let count;

    if (search) {
      products = await Product.find({
        $and: [
          { is_listed: true },
          {
            $or: [
              { product_name: { $regex: '.*' + search + '.*', $options: 'i' } },
              { category: { $regex: '.*' + search + '.*', $options: 'i' } },
            ],
          },
        ],
      })
        .skip((page - 1) * limit)
        .limit(limit);

      count = await Product.find({
        $and: [
          { is_listed: true },
          {
            $or: [
              { product_name: { $regex: '.*' + search + '.*', $options: 'i' } },
              { category: { $regex: '.*' + search + '.*', $options: 'i' } },
            ],
          },
        ],
      }).countDocuments();
    } else {
      // Fetch all products with pagination
      products = await Product.find({ is_listed: true })
        .skip((page - 1) * limit)
        .limit(limit);

      count = await Product.find({ is_listed: true }).countDocuments();
    }

    const totalPages = Math.ceil(count / limit);

    res.render('shop', { categories, products, search, currentPage: page, totalPages, user: req.session.user_id });
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

            // Fetch user's cart
            let userCart = await Cart.findOne({ user: userId });

            if (!userCart) {
                // If the user doesn't have a cart, create a new one
                userCart = new Cart({ user: userId, products: [] });
            }

            // Check if the product is already in the cart
            const existingProductIndex = userCart.products.findIndex(product =>String(product.productId) === String(productId));

            if (existingProductIndex !== -1) {
                // If the product is in the cart, update the quantity
                const existingProduct = userCart.products[existingProductIndex];

                console.log('Product Stock:', productData.stock);
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


const removeProduct = async (req, res) => {
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
    console.log(error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

const loadCheckout = async (req, res, next) => {
  try {
    const userId = req.session.user_id;

    // Fetch user data
    const userData = await userModel.findById(userId);

    // Fetch cart details
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'products.productId',
      model: 'product', // Replace with the actual model name for your products
    });

    // console.log('Cart:', cart);

    // Fetch user addresses
    const addresses = await Address.findOne({ user_id: userId });

    // console.log(addresses);

    // console.log('Addresses:', addresses); 

    if (cart) {
      if (addresses && addresses.address && addresses.address.length > 0) {
        let total = 0;
       

        // Calculate total
        cart.products.forEach((product) => {
        
          total += product.quantity * product.productId.product_price;
        });  

        

        res.render('checkout', { cart, addresses: addresses.address, total, userData });
      } else {
        res.render('checkout', {
          userData,
          cart,
          addresses: [],
          total: 0
        });
      }
    } else { 
      console.log('Cart not found');
      res.redirect('/view-cart');
    }
  } catch (err) {
    console.error('Error in loadCheckout:', err);
    next(err);
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

// const editAddressPagecheckout = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     const usersData = await takeUserData(userId);
//     const addressId = req.params.addressId;

//     // Fetch the user's address data
//     const address = await Address.findOne({ user_id: userId });

//     console.log('Address data:', address);
//     console.log('Address ID:', addressId);

//     if (usersData && address) {
//       res.render('editaddress', { users: usersData, address: address, addressIdcheckout: addressId });
//     } else {
//       console.log('User Data or Address is null or undefined');
//       res.redirect('/checkout');
//     }
//   } catch (error) {
//     console.log(error);
//     res.redirect('/checkout');
//   }
// };

// const editAddresscheckout = async (req, res) => {
//   try {
//     console.log('Edit Address Page accessed');
//     const userId = req.session.user_id;
//     const addressId = req.body.addressId; // Retrieve addressId from the request body it's passing as hidden in the form

//     // Fetch the existing address data
//     const existingAddress = await Address.findOne({ user_id: userId, 'address._id': addressId });

//     if (existingAddress) {
//       // Find the specific address within the user's addresses
//       const targetAddress = existingAddress.address.find(addressItem => addressItem._id.toString() === addressId);

//       console.log('Existing Address:', existingAddress);
//       console.log('Target Address:', targetAddress);

//       if (targetAddress) {
//         console.log('Target Address Fullname:', targetAddress.fullname);

//         // Update the address fields based on the form data
//         targetAddress.fullname = req.body.fullname;
//         targetAddress.mobile = req.body.mobile;
//         targetAddress.housename = req.body.housename;
//         targetAddress.city = req.body.city;
//         targetAddress.state = req.body.state;
//         targetAddress.district = req.body.district;
//         targetAddress.pin = req.body.pin;
//         // Add other fields as needed

//         // Save the updated address data
//         await existingAddress.save();

//         res.redirect('/checkout'); // Redirect to checkout after a successful update
//       } else {
//         console.log('Address not found for user');
//         res.redirect('/checkout'); // Redirect to checkout if address data not found
//       }
//     } else {
//       console.log('User not found or address not found for user');
//       res.redirect('/checkout'); // Redirect to checkout if user or address data not found
//     }
//   } catch (error) {
//     console.log(error);
//     res.redirect('/checkout'); // Redirect to checkout in case of an error
//   }
// };

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

 
// const placeOrder = async (req, res) => {
//   try {
//     const { selected_address, payment_method, totalAmount } = req.body;
//     const userId = req.session.user_id;

//     console.log('User ID:', userId);
//     console.log('Address ID:', selected_address);
//     console.log('Payment Option:', payment_method);
//     console.log('Total Amount:', totalAmount);

//     const cartItems = await Cart.findOne({ user: userId }).populate({ 
//       path: 'products.productId',
//       model: 'product',
//     });

//     console.log('Cart Items:', cartItems);

//     if (!cartItems || !cartItems.products || cartItems.products.length === 0) { 
//       console.log('Cart is empty. Unable to place an order.');
//       return res.status(400).json({
//         success: false,
//         message: 'Cart is empty. Unable to place an order.',
//       });
//     }

//     // Parse totalAmount as a number
//     const numericTotal = parseFloat(totalAmount);

//     // Create a new order
//     const newOrder = new Order({
//       user: userId,
      
//       deliveryAddress: selected_address,
//       paymentOption: payment_method,
//       totalAmount: numericTotal,
//       orderDate: new Date(),
//       // Add more details to the order as needed
//     });

//     console.log('New Order:', newOrder);

//     // Save the order to the database
//     await newOrder.save();

//     // Update product stock (for COD payments)
//     if (payment_method === 'COD') {
//       for (const item of cartItems.products) {
//         const productId = item.productId._id;
//         const quantity = parseInt(item.quantity, 10);
//         console.log('Updating product stock for Product ID:', productId, 'Quantity:', quantity);

//         // Assuming you have a Product model with a 'quantity' field
//         await Product.findByIdAndUpdate(productId, {
//           $inc: { quantity: -quantity },
//         });
//       }
//     }

//     // Clear the user's cart
//     await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });

//     // Redirect to the orderplaced route
//     res.redirect('/orderplaced');
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Failed to place the order' });
//   }
// };

 
// 
// const placeOrder = async (req, res) => {
//   try {
//     const { selected_address, payment_method, totalAmount } = req.body;
//     const userId = req.session.user_id;

//     console.log('User ID:', userId);
//     console.log('Address ID:', selected_address);
//     console.log('Payment Option:', payment_method);
//     console.log('Total Amount:', totalAmount);

//     const cartItems = await Cart.findOne({ user: userId }).populate({ 
//       path: 'products.productId',
//       model: 'product',
//     });

//     console.log('Cart Items:', cartItems);

//     if (!cartItems || !cartItems.products || cartItems.products.length === 0) { 
//       console.log('Cart is empty. Unable to place an order.');
//       return res.status(400).json({
//         success: false,
//         message: 'Cart is empty. Unable to place an order.',
//       });
//     }

//     // Parse totalAmount as a number
//     const numericTotal = parseFloat(totalAmount);

//     // Create a new order
//     const newOrder = new Order({
//       user: userId,
//       cart: {
//         user: userId,
//         products: cartItems.products, // Include product details directly in the cart
//       },
//       deliveryAddress: selected_address,
//       paymentOption: payment_method,
//       totalAmount: numericTotal,
//       orderDate: new Date(),
//       // Add more details to the order as needed
//     });

//     console.log('New Order:', newOrder);

//     // Save the order to the database
//     await newOrder.save();

//     // Update product stock (for COD payments)
//     if (payment_method === 'COD') {
//       for (const item of cartItems.products) {
//         const productId = item.productId._id;
//         const quantity = parseInt(item.quantity, 10);
//         console.log('Updating product stock for Product ID:', productId, 'Quantity:', quantity);

//         // Assuming you have a Product model with a 'quantity' field
//         await Product.findByIdAndUpdate(productId, {
//           $inc: { quantity: -quantity },
//         });
//       }
//     }

//     // Clear the user's cart
//     await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });

//     // Redirect to the orderplaced route
//     res.redirect('/orderplaced');
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Failed to place the order' });
//   }
// };


// const placeOrder = async (req, res) => {
//   try {
//     const { selected_address, payment_method, totalAmount } = req.body;
//     const userId = req.session.user_id;

//     // Fetch cart items
//     const cartItems = await Cart.findOne({ user: userId }).populate({
//       path: 'products.productId',
//       model: 'product',
//     });

//     // Check if the cart is empty
//     if (!cartItems || !cartItems.products || cartItems.products.length === 0) {
//       console.log('Cart is empty. Unable to place an order.');
//       return res.status(400).json({
//         success: false,
//         message: 'Cart is empty. Unable to place an order.',
//       });
//     }

//     // Parse totalAmount as a number
//     const numericTotal = parseFloat(totalAmount);

//     // Create a new order
//     const newOrder = new Order({
//       user: userId,
//       cart: {
//         user: userId,
//         products: cartItems.products, // Include product details directly in the cart
//       },
//       deliveryAddress: selected_address,
//       paymentOption: payment_method,
//       totalAmount: numericTotal,
//       orderDate: new Date(),
//       // Add more details to the order as needed
//     });

//     // Save the order to the database
//     await newOrder.save();

//     // Update product stock (for COD payments)
//     if (payment_method === 'COD') {
//       // Use bulkWrite to update stock atomically
//       const stockUpdateOperations = cartItems.products.map((item) => {
//         const productId = item.productId._id;
//         const quantity = parseInt(item.quantity, 10);

//         return {
//           updateOne: {
//             filter: { _id: productId, stock: { $gte: quantity } }, // Ensure enough stock
//             update: { $inc: { stock: -quantity } },
//           },
//         };
//       });

//       // Execute the bulkWrite operation
//       const stockUpdateResult = await Product.bulkWrite(stockUpdateOperations);

//       // Check if any stock update failed
//       if (stockUpdateResult.writeErrors.length > 0) {
//         console.log('Failed to update stock for some products');
//         // Handle the case where the stock update failed, e.g., redirect to an error page
//         return res.status(500).json({
//           success: false,
//           message: 'Failed to update stock for some products',
//         });
//       }
//     }

//     // Clear the user's cart
//     await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });

//     // Redirect to the orderplaced route
//     res.redirect('/orderplaced');
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Failed to place the order' });
//   }
// };

// const placeOrder = async (req, res) => {
//   try {
//     const { selected_address, payment_method, totalAmount } = req.body;
//     const userId = req.session.user_id;

//     // Fetch cart items
//     const cartItems = await Cart.findOne({ user: userId }).populate({
//       path: 'products.productId',
//       model: 'product',
//     });

//     // Check if the cart is empty or cartItems is null
//     if (!cartItems || !cartItems.products || !Array.isArray(cartItems.products) || cartItems.products.length === 0) {
//       console.log('Cart is empty. Unable to place an order.');
//       return res.status(400).json({
//         success: false,
//         message: 'Cart is empty. Unable to place an order.',
//       });
//     }

//     // Parse totalAmount as a number
//     const numericTotal = parseFloat(totalAmount);

//     // Create a new order
//     const newOrder = new Order({
//       user: userId,
//       cart: {
//         user: userId,
//         products: cartItems.products, // Include product details directly in the cart
//       },
//       deliveryAddress: selected_address,
//       paymentOption: payment_method,
//       totalAmount: numericTotal,
//       orderDate: new Date(),
//       // Add more details to the order as needed
//     });

//     // Save the order to the database
//     await newOrder.save();

//     // Update product stock (for COD payments)
//     if (payment_method === 'COD') {
//       // Use bulkWrite to update stock atomically
//       const stockUpdateOperations = cartItems.products.map((item) => {
//         const productId = item.productId._id;
//         const quantity = parseInt(item.quantity, 10);

//         return {
//           updateOne: {
//             filter: { _id: productId, stock: { $gte: quantity } }, // Ensure enough stock
//             update: { $inc: { stock: -quantity } },
//           },
//         };
//       });

//       // Execute the bulkWrite operation
//       const stockUpdateResult = await Product.bulkWrite(stockUpdateOperations);

//       // Check if any stock update failed
//       if (stockUpdateResult.writeErrors && stockUpdateResult.writeErrors.length > 0) {
//         console.log('Failed to update stock for some products');
//         // Handle the case where the stock update failed, e.g., redirect to an error page
//         return res.status(500).json({
//           success: false,
//           message: 'Failed to update stock for some products',
//         });
//       }
//     }

//     // Clear the user's cart
//     await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });

//     // Redirect to the orderplaced route
//     res.redirect('/orderplaced');
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Failed to place the order' });
//   }
// };

const placeOrder = async (req, res) => {
  try {
    const { selected_address, payment_method, totalAmount } = req.body;
    const userId = req.session.user_id;

    // Fetch cart items
    const cartItems = await Cart.findOne({ user: userId }).populate({
      path: 'products.productId',
      model: 'product',
    });

    // Check if the cart is empty or cartItems is null
    if (!cartItems || !cartItems.products || !Array.isArray(cartItems.products) || cartItems.products.length === 0) {
      console.log('Cart is empty. Unable to place an order.');
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Unable to place an order.',
      });
    }

    // Parse totalAmount as a number
    const numericTotal = parseFloat(totalAmount);

    // Create a new order with status 'Placed'
    const newOrder = new Order({
      user: userId,
      cart: {
        user: userId,
        products: cartItems.products, // Include product details directly in the cart
      },
      deliveryAddress: selected_address,
      paymentOption: payment_method,
      totalAmount: numericTotal,
      orderDate: new Date(),
      status: 'Placed', // Set the initial status as 'Placed'
    });

    // Save the order to the database
    await newOrder.save();

    // Update product stock (for COD payments)
    if (payment_method === 'COD') {
      // Use bulkWrite to update stock atomically
      const stockUpdateOperations = cartItems.products.map((item) => {
        const productId = item.productId._id;
        const quantity = parseInt(item.quantity, 10);

        return {
          updateOne: {
            filter: { _id: productId, stock: { $gte: quantity } }, // Ensure enough stock
            update: { $inc: { stock: -quantity } },
          },
        };
      });

      // Execute the bulkWrite operation
      const stockUpdateResult = await Product.bulkWrite(stockUpdateOperations);

      // Check if any stock update failed
      if (stockUpdateResult.writeErrors && stockUpdateResult.writeErrors.length > 0) {
        console.log('Failed to update stock for some products');
        // Handle the case where the stock update failed, e.g., redirect to an error page
        return res.status(500).json({
          success: false,
          message: 'Failed to update stock for some products',
        });
      }
    }

    // Clear the user's cart
    await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });

    // Redirect to the orderplaced route
    res.redirect('/orderplaced');
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to place the order' });
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

 

module.exports={
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
    orderDetails,
    cancelOrder,
    updateProfile,
    addAddress,
    editAddressPage,
    editAddress,
    deleteAddress,

    shopLoad,
    shopdetailsLoad,

    addToCart,
    getCartProducts,
    cartQuantity,
    removeProduct,

    loadCheckout, 
    addShippingAddress,
    editAddressPagecheckout,
    editAddresscheckout,
    placeOrder, 

    orderPlaced

}