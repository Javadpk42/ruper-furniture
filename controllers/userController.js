const userModel = require("../model/userModel")

const Category = require('../model/productModel').category;
const Product = require('../model/productModel').product;
const Cart=require('../model/cartModel')
const { ObjectId } = require('mongoose').Types;


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
        res.render('home')
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
      res.render('login')
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

      console.log("Email:", email);
      console.log("Password:", password);
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
      console.log('User ID from form submission:', id);
  
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
    console.log('Retrieved User Data:', userData); // Add this line for debugging
    return userData;
  } catch (error) {
    console.log('Error retrieving user data:', error);
    throw error; // Re-throw the error to handle it in the calling function if needed
  }
};


const profileLoad = async (req, res) => {
  try {
    const userData = await takeUserData(req.session.user_id);
    console.log('User Data:', userData); // Add this line for debugging

    // Check if userData is not null or undefined
    if (userData) {
      res.render('profile', { users: userData, user: req.session.user_id });
    } else {
      console.log('User Data is null or undefined');
      res.render('profile', { users: null, user: req.session.user_id });
    }
  } catch (error) {
    console.log(error);
    res.render('profile', { users: null, user: req.session.user_id, error: 'Error fetching user data' });
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

    res.render('shop', { categories, products, search, currentPage: page, totalPages });
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
      res.render('shopdetails', { product });
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
            const existingProductIndex = userCart.products.findIndex(product => product.productId == productId);

            if (existingProductIndex !== -1) {
                // If the product is in the cart, update the quantity
                const existingProduct = userCart.products[existingProductIndex];
                if (productData.stock <= existingProduct.quantity) {
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

// cartController.js
// const displayCart = async (req, res) => {
//   try {
//     // Check if the user is logged in
//     if (!req.session.user_id) {
//       return res.render('login', { errors: 'Please log in to view your cart' });
//     }

//     const userId = req.session.user_id;

//     // Fetch user's cart
//     const cart = await Cart.findOne({ user: userId }).populate('products.productId');

//     // Render the cart view with the cart data
//     res.render('cart', { cart });
//   } catch (error) {
//     console.log(error);
//     // Handle errors, e.g., render an error page
//     res.render('error', { error: 'An error occurred' });
//   }
// };  


// const cartLoad=async(req,res)=>{
//     try {
//         res.render('cart')
//     } catch (error) {
//         console.log(error.message )
//     }
// }
const checkoutLoad=async(req,res)=>{
    try {
        res.render('checkout')
    } catch (error) {
        console.log(error.message )
    }
}

// const getCartProducts = async (req, res) => {
//   try {
//     const name = req.session.user_id;
//       console.log(name);
//       const userData = await userModel.findById(name);
//       const userId = userData._id;
      
//       const cartData = await Cart.findOne({ user: userId }).populate("products.productId");
//       console.log(cartData);
//       if (req.session.user) {
//           if (cartData) {

//               if (cartData.products != 0) {
//                   let Total
//                   const total = await Cart.aggregate([
//                       {
//                           $match: { user: new ObjectId(userId) }
//                       },
//                       {
//                           $unwind: '$products'
//                       },
//                       {
//                           $project: {
//                               quantity: "$products.quantity",
//                               price: "$products.price"
//                           }
//                       },
//                       {
//                           $group:{
//                               _id:null,
//                               total:{
//                                   $sum:{
//                                       $multiply:["$quantity","$price"]
//                                   }
//                               }
//                           }
//                       }
//                   ])
//                   Total=total[0].total
                  
//                   res.render('cart');
//                   // { user: req.session.user,userId:userId,cart: cartData.products,total:Total }
//               } else {
//                   res.render('cart',{user:req.session.user,message:"hy"})
//               }



             
//           } else {
//               res.render('cart', { user: req.session.user, message: "hy" })
//           }
//       } else {

//       }
//   } catch (error) {
//       console.log(error);
//   }
// }

// const getCartProducts = async (req, res) => {
//   try {
//     if (req.session.user_id) {
//       const userId = req.session.user_id;
//       const cartData = await Cart.findOne({ user: userId }).populate("products.productId");

//       if (cartData && cartData.products.length > 0) {
//         let total = 0;
//         cartData.products.forEach((product) => {
//           total += product.quantity * product.price;
//         });

//         res.render('cart', { user: req.session.user, userId: userId, cart: cartData.products, total: total });
//       } else {
//         res.render('cart', { user: req.session.user, message: "Cart is empty" });
//       }
//     } else {
//       res.render('login', { errors: "Please log in to view your cart" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.render('error', { error: 'An error occurred' });
//   }
// }; 
const getCartProducts = async (req, res) => {
  try {
    if (req.session.user_id) {
      const userId = req.session.user_id;
      const cartData = await Cart.findOne({ user: userId }).populate("products.productId");

      if (cartData && cartData.products.length > 0) {
        let total = 0;
        cartData.products.forEach((product) => {
          total += product.quantity * product.productId.product_price;
        });

        res.render('cart', { user: req.session.user, userId: userId, cart: cartData.products, total: total });
      } else {
        res.render('cart', { user: req.session.user, message: "Cart is empty" });
      }
    } else {
      res.render('login', { errors: "Please log in to view your cart" });
    }
  } catch (error) {
    console.log(error);
    res.render('error', { error: 'An error occurred' });
  }
};

const cartQuantity =async (req,res)=>{
  try {
     
      console.log('api');
      let number=parseInt(req.body.count)
     const proId=req.body.product
     const userId=req.body.user
     const count= number

     
     console.log(count);
    
     const cartData = await Cart.findOne({ user: new ObjectId(userId), "products.productId": new ObjectId(proId)},
                      { "products.productId.$": 1, "products.quantity": 1 })
     console.log("cartdata  :",cartData);

     const [{quantity:quantity}]=cartData.products
     stockAvailable=await Product.find({_id:new ObjectId(proId)})

     if(stockAvailable.stock < quantity+count){
      res.json({success:false})
     }else{
      const datat=await Cart.updateOne({user:userId,"products.productId":proId},
      {
          $inc:{"products.$.quantity": count}
      })
      res.json({changeSuccess:true})
     }

  } catch (error) {
      console.log(error);
  }
}
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






module.exports={
    homeLoad,

    loadSignup,
    loadOtp,
    sendOtp,
    resendOtp,
    verifyOtp,

    loginLoad,
    verifyLogin,

    forgotLoad,
    forgotVerify,
    resetpasswordLoad,
    resetPassword,

    profileLoad,

    shopLoad,

    shopdetailsLoad,

    // cartLoad,

    checkoutLoad,

    addToCart,
    getCartProducts,
    cartQuantity,
    removeProduct
   
}