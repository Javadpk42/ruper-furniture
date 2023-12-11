
const Razorpay = require("razorpay");
const crypto = require("crypto");
const userModel = require("../model/userModel");
const mongoose = require("mongoose");

const shortid = require("shortid");

const Category = require("../model/productModel").category;
const Product = require("../model/productModel").product;
const Cart = require("../model/cartModel");
const { ObjectId } = require("mongoose").Types;

const Address = require("../model/addressModel");
const Order = require("../model/orderModel");
const Coupon = require("../model/couponModel");
const Banner = require("../model/bannerModel");

const Wishlist = require("../model/wishlistModel");

const bcrypt = require("bcrypt");
const { name } = require("ejs");
const ejs = require("ejs");

const fs = require("fs");

const pdf = require("html-pdf");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const path = require("path");
const randomstring = require("randomstring");
const { product } = require("../model/productModel");




const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {}
};

const homeLoad = async (req, res, next) => {
  try {
    const banners = await Banner.find({});
    const products = await Product.find({}).limit(5);
    res.render("home", { user: req.session.user_id, banners, products });
  } catch (error) {
    next(error);
  }
};
const aboutLoad = async (req, res, next) => {
  try {
    res.render("about", { user: req.session.user_id });
  } catch (error) {
    next(error);
  }
};
const faqLoad = async (req, res, next) => {
  try {
    res.render("faq", { user: req.session.user_id });
  } catch (error) {
    next(error);
  }
};
const contactLoad = async (req, res, next) => {
  try {
    res.render("contact", { user: req.session.user_id });
  } catch (error) {
    next(error);
  }
};

const loadSignup = async (req, res, next) => {
  try {
    res.render("registration", { message: null, user: req.session.user_id });
  } catch (error) {
    next(error);

  }
};

const loadOtp = async (req, res,next) => {
  try {
    res.render("otp", { user: req.session.user_id });
  } catch (error) {
    next(error);

  }
};

const sendOtp = async (req, res,next) => {
  try {
    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
    });

    const currentTime = new Date();
    const otpCreationTime = currentTime.getMinutes();
    req.session.otp = {
      code: otp,
      creationTime: otpCreationTime,
    };

    const userCheck = await userModel.findOne({ email: req.body.email });

    if (userCheck) {
      res.render("registration", {
        message: "Email is already registered. Please use a different email.",
      });
      return;
    }

    const spassword = await securePassword(req.body.password);

    req.session.username = req.body.username;
    req.session.mobile = req.body.mobile;
    req.session.email = req.body.email;

    if (req.body.referralCode) {
      const referringUser = await userModel.findOne({
        referralCode: req.body.referralCode,
      });

      if (referringUser) {
        req.session.referralUserId = referringUser._id;
      } else {
        res.render("registration", {
          message: "Invalid referral code. Please use a valid referral code.",
        });
        return;
      }
    }

    const referralCode = shortid.generate();
    req.session.referralCode = referralCode;

    if (req.body.username && req.body.email && req.session.mobile) {
      if (req.body.password === req.body.cpassword) {
        req.session.password = spassword;

        otpSent(req.session.email, req.session.otp.code);
        res.redirect("otpverification");
      } else {
        res.render("registration");
      }
    }
  } catch (error) {
    next(error);

  }
};

const resendOtp = async (req, res, next ) => {
  try {
    req.session.otp = req.session.otp || {};

    const newOTP = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
    });
    req.session.otp.code = newOTP;

    const currentTime = new Date();
    req.session.otp.creationTime = currentTime.getMinutes();

    otpSent(req.session.email, req.session.otp.code);

    res.render("otp", {
      message: "OTP resent successfully",
      user: req.session.user_id,
    });
  } catch (error) {
    next(error);

  }
};

const otpSent = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "csa20218042@gmail.com",
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: "csa20218042@gmail.com",
      to: email,
      subject: "Verify Your Email",
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {}
};   

const verifyOtp = async (req, res,next) => { 
  try {
    const enteredOTP = req.body.otp;
    const storedOTP = req.session.otp.code;
    const otpCreationTime = req.session.otp.creationTime;

    const currentTimeFull = new Date();
    const currentTime = currentTimeFull.getMinutes();

    const timeDiff = currentTime - otpCreationTime;

    if (enteredOTP === storedOTP && timeDiff <= 1) {
      const referralCode = req.session.referralCode;

      const user = new userModel({
        username: req.session.username,
        email: req.session.email,
        mobile: req.session.mobile,
        password: req.session.password,
        is_verified: true,
        referralCode: referralCode,
      });

      const result = await user.save();

      if (referralCode) {
        const referringUserId = req.session.referralUserId;
        const referringUser = await userModel.findById(referringUserId);

        if (referringUser) {
          referringUser.referredBy = result._id;
          await referringUser.save();

          const bonusAmount = 100;

          referringUser.wallet += bonusAmount;
          referringUser.walletHistory.push({
            date: new Date(),
            amount: bonusAmount,
            description: `Referral bonus for user ${result.username}`,
            transactionType: "Credit",
          });
          await referringUser.save();

          result.wallet += bonusAmount;
          result.walletHistory.push({
            date: new Date(),
            amount: bonusAmount,
            description: "Referral bonus",
            transactionType: "Credit",
          });
          await result.save();
        }
      }

      res.redirect("/login");
    } else {
      res.render("otp", {
        message: "Invalid OTP or OTP has expired",
        user: req.session.user_id,
      });
    }
  } catch (error) {
    next(error);

  }
};

const loginLoad = async (req, res,next) => {
  try {
    const errorMessage = req.query.errors;

    res.render("login", { errors: errorMessage, user: req.session.user_id });
  } catch (error) {
    next(error);

  }
};

const verifyLogin = async (req, res,next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
      res.render("login", {
        errors: "Please fill in both email and password fields",
      });
      return;
    }

    const userData = await userModel.findOne({ email: email });

    if (userData) {
      if (userData.is_verified === false) {
        res.render("login", {
          errors: "Your account is blocked. Contact support for assistance.",
        });
        return;
      }

      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        req.session.user_id = userData._id;
        res.redirect("/");
      } else {
        res.render("login", { errors: "Email and password are incorrect" });
      }
    } else {
      res.render("login", { errors: "Email and password are incorrect" });
    }
  } catch (error) {
    next(error);

  }
};

const userLogout = async (req, res,next) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    next(error);

  }
};

const forgotLoad = async (req, res,next) => {
  try {
    res.render("forgot", { user: req.session.user_id });
  } catch (error) {
    next(error);

  }
};
const resetPasswordMail = async (username, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "csa20218042@gmail.com",
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: "csa20218042@gmail.com",
      to: email,
      subject: "For Reset Password",
      html: `<p> Hi, ${username}, please click here to <a href="http://ruperfurniture.online/resetpassword?token=${token}"> Reset </a> your password</p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {});
  } catch (error) {}
};

const forgotVerify = async (req, res,next) => {
  try {
    const email = req.body.email;
    const userData = await userModel.findOne({ email: email });
    if (userData) {
      if (userData.is_verified === false) {
        res.json({ message: "Please enter a verified email" });
      } else {
        const randomString = randomstring.generate();
        const updatedData = await userModel.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );

        resetPasswordMail(userData.username, userData.email, randomString);
        res.json({ message: "Please check your mail to reset your password" });
      }
    } else {
      res.json({ message: "User email is incorrect" });
    }
  } catch (error) {
    next(error);
  }
};

const resetpasswordLoad = async (req, res,next) => {
  try {
    const token = req.query.token;

    const user = await userModel.findOne({ token: token });

    if (user) {
      res.render("reset", { user_id: user._id, user: req.session.user_id });
    } else {
      res.render("404", { message: "Token is Invalid" });
    }
  } catch (error) {
    next(error);

  }
};

const resetPassword = async (req, res,next) => {
  try {
    const id = req.body.id;

    if (!id) {
      return res.status(400).send("User ID is missing in the form submission");
    }

    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.findOneAndUpdate(
      { _id: id },
      { $set: { password: hashedPassword } },
      { new: true }
    );

    if (!user) {
      return res.status(404).send("User not found in the database");
    }

    res.redirect("/login");
  } catch (error) {
    next(error);
  }
};

const takeUserData = async (userId) => {
  try {
    const userData = await userModel.findOne({ _id: userId });
    return userData;
  } catch (error) {
    throw error;
  }
};

const profileLoad = async (req, res,next) => {
  try {
    if (!req.session.user_id) {
      return res.redirect("/login?errors=Please log in to view");
    }

    const userId = req.session.user_id;

    const userData = await takeUserData(userId);

    const addressData = await Address.findOne({ user_id: userId });
    const coupons = await Coupon.find();

    const orders = await Order.find({ user: userId }).sort({ orderDate: -1 });

    const cart = await Cart.findOne({ user: userId }).populate(
      "products.productId"
    );

    if (userData) {
      res.render("profile", {
        users: userData,
        user: userId,
        address: addressData ? addressData.address : null,
        orders,
        cart,
        coupons,
      });
    } else {
      res.render("profile", {
        users: null,
        user: userId,
        orders: [],
        cart: null,
      });
    }
  } catch (error) {
    next(error);

  }
};

const allordersLoad = async (req, res, next) => {
  try {
    const userId = req.session.user_id; 

    const orders = await Order.find({ user: userId }).sort({ orderDate: -1 });

    res.render("allorders", {
      orders,
    });
  } catch (error) {
    next(error);
  }
};



const invoiceDownload = async (req, res, next) => {
  try {
    const { orderId } = req.query;

    const orderData = await Order.findById(orderId)
      .populate("cart.products.productId")
      .populate("user");

    if (!orderData) {
      return res.status(404).send("Order not found");
    }

    const userId = req.session.user_id;
    let sumTotal = 0;
    const userData = await userModel.findById(userId);

    orderData.cart.products.forEach((item) => {
      const total = item.productId.product_price * item.quantity;
      sumTotal += total;
    });

    const date = new Date();

    const data = {
      order: orderData,
      user: userData,
      date, 
      sumTotal,
    };

    const filepathName = path.resolve(__dirname, "../views/user/invoice.ejs");
    const html = fs.readFileSync(filepathName).toString();
    const ejsData = ejs.render(html, data);

    const pdfOptions = { format: "Letter" };

    pdf.create(ejsData, pdfOptions).toBuffer((err, buffer) => {
      if (err) {
        return next(err);
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=order_invoice.pdf"
      );
      res.send(buffer);
    });

  } catch (error) {
    next(error);
  }
};


const orderDetails = async (req, res,next) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId).populate({
      path: "cart.products.productId",
      model: "product",
    });

    if (!order) {
      return res.status(404).render("error", { message: "Order not found" });
    }

    const {
      cart,
      deliveryAddress,
      paymentOption,
      totalAmount,
      orderDate,
      status,
    } = order;

    res.render("orderdetails", {
      order: {
        _id: order._id,
        cart,
        deliveryAddress,
        paymentOption,
        totalAmount,
        orderDate,
        status,
      },
      user: req.session.user_id,
    });
  } catch (error) {
    next(error);

  }
};

const cancelOrderAjax = async (req, res,next) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findOne({
      "cart.products._id": orderId,
    }).populate({
      path: "cart.products.productId",
      model: "product",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    for (const product of order.cart.products) {
      if (
        product._id.toString() === orderId &&
        (product.orderStatus === "Placed" ||
          product.orderStatus === "Shipped" ||
          product.orderStatus === "Out for delivery")
      ) {
        const canceledProduct = await Product.findById(product.productId);
        canceledProduct.stock += product.quantity;
        await canceledProduct.save();
        let refundedAmount = product.price * product.quantity;

        if (
          order.paymentOption === "Razorpay" ||
          order.paymentOption === "Wallet"
        ) {
          await userModel.findByIdAndUpdate(
            { _id: order.user },
            {
              $inc: { wallet: refundedAmount },
              $push: {
                walletHistory: {
                  date: new Date(),
                  amount: refundedAmount,
                  description: `Refund from Order cancel - Order ${order._id}`,
                  transactionType: "Credit",
                },
              },
            }
          );

          product.orderStatus = "Cancelled";
          break;
        } else if (order.paymentOption === "COD") {
          product.orderStatus = "Cancelled";
          break;
        }
      }
    }

    await order.save();

    res.json({ success: true, message: "Order canceled successfully" });
  } catch (error) {
    next(error);

  }
};

const returnOrderAjax = async (req, res,next) => {
  try {
    const orderId = req.body.orderId;
    const reason = req.body.reason;

    const order = await Order.findOne({
      "cart.products._id": orderId,
    }).populate({
      path: "cart.products.productId",
      model: "product",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const product = order.cart.products.find(
      (p) => p._id.toString() === orderId
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found in the order",
      });
    }

    const currentDate = new Date().getTime();
    const expectedDeliveryDate = new Date(product.expectedDelivery).getTime();

    const fourteenDaysInMilliseconds = 14 * 24 * 60 * 60 * 1000;

    if (currentDate - expectedDeliveryDate > fourteenDaysInMilliseconds) {
      return res.status(400).json({
        success: false,
        message: "Return period has exceeded",
      });
    }

    product.returnOrder.status = true;
    product.returnOrder.returnStatus = "Placed";
    product.returnOrder.reason = reason;

    await order.save();

    return res.json({ success: true, message: "Order returned successfully" });
  } catch (error) {
    next(error);

  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.session.user_id;

    const username = req.body.username;
    const mobile = req.body.mobile;

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).send("User not found");
    }

    userData.username = username;
    userData.mobile = mobile;

    await userData.save();

    res.redirect("/profile");
  } catch (err) {
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
      return res.status(404).json({ error: "User not found" });
    }

    if (newPassword && newPassword === confirmPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        userData.password
      );
      const isSamePassword = await bcrypt.compare(
        newPassword,
        userData.password
      );

      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      if (isSamePassword) {
        return res
          .status(400)
          .json({ error: "New password and old password are the same" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      userData.password = hashedPassword;

      await userData.save();

      return res.json({ success: true });
    } else {
      return res
        .status(400)
        .json({ error: "New password and confirm password do not match" });
    }
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const userId = req.session.user_id;

    const address = await Address.find({ user_id: userId });

    if (address.length > 0) {
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
              state: req.body.state,
            },
          },
        }
      );
    } else {
      const newAddress = new Address({
        user_id: userId,
        address: [
          {
            fullname: req.body.fullname,
            mobile: req.body.mobile,
            housename: req.body.housename,
            pin: req.body.pin,
            city: req.body.city,
            district: req.body.district,
            state: req.body.state,
          },
        ],
      });

      const saveResult = await newAddress.save();
    }

    res.redirect("/profile");
  } catch (err) {
    next(err);
  }
};

const editAddressPage = async (req, res,next) => {
  try {
    const userId = req.session.user_id;
    const usersData = await takeUserData(userId);
    const addressId = req.params.addressId;

    const address = await Address.findOne({ user_id: userId });

    if (usersData && address) {
      res.render("editaddress", {
        users: usersData,
        address: address,
        addressId: addressId,
        user: req.session.user_id,
      });
    } else {
      res.redirect("/profile");
    }
  } catch (error) {
    res.redirect("/profile");
  }
};

const editAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.body.addressId;
    const existingAddress = await Address.findOne({
      user_id: userId,
      "address._id": addressId,
    });

    if (existingAddress) {
      const targetAddress = existingAddress.address.find(
        (addressItem) => addressItem._id.toString() === addressId
      );

      if (targetAddress) {
        targetAddress.fullname = req.body.fullname;
        targetAddress.mobile = req.body.mobile;
        targetAddress.housename = req.body.housename;
        targetAddress.city = req.body.city;
        targetAddress.state = req.body.state;
        targetAddress.district = req.body.district;
        targetAddress.pin = req.body.pin;

        await existingAddress.save();

        res.redirect("/profile");
      } else {
        res.redirect("/profile");
      }
    } else {
      res.redirect("/profile");
    }
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res,next) => {
  try {
    const addressId = req.params.addressId;
    const userId = req.session.user_id;

    const result = await Address.updateOne(
      { user_id: userId },
      { $pull: { address: { _id: addressId } } }
    );

    if (result.matchedCount > 0) {
      res.redirect("/profile");
    } else {
      res.status(404).json({ message: "Address not found", remove: 0 });
    }
  } catch (error) {
    next(error);
  }
};




const shopLoad = async (req, res, next) => {
  try {
    const { search, category: selectedCategory, sort } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;

    const categories = await Category.find({ is_listed: true });

    const categoryCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({
          category: { $regex: new RegExp(".*" + category.category_name + ".*", "i") },
        });
        return { name: category.category_name, count };
      })
    );

    const filterCriteria = {
      is_listed: true,
    };

    if (search) {
      filterCriteria.$or = [
        { product_name: { $regex: new RegExp(".*" + search + ".*", "i") } },
        { category: { $regex: new RegExp(".*" + search + ".*", "i") } },
      ];
    }

    if (selectedCategory) {
      filterCriteria.category = {
        $regex: new RegExp(".*" + selectedCategory + ".*", "i"),
      };
    }

    let sortOption = {};

    if (sort === "lowtohigh") {
      sortOption = { product_price: 1 };
    } else if (sort === "hightolow") {
      sortOption = {  product_price: -1 };
    }

    const productsQuery = Product.find(filterCriteria)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    const countQuery = Product.find(filterCriteria).countDocuments();

    const [products, count] = await Promise.all([productsQuery, countQuery]);

    const totalPages = Math.ceil(count / limit);

    const totalRatings = products.reduce((sum, product) => {
      const productTotalRatings = product.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      return sum + productTotalRatings;
    }, 0);

    const averageRating = count > 0 ? totalRatings / count : 0;
    console.log("Product Names:", products);

    res.render("shop", {
      categories,
      categoryCounts,
      products,
      search,
      selectedCategory,
      currentPage: page,
      totalPages,
      user: req.session.user_id,
      averageRating,
      currentSort: sort,
    });
  } catch (error) {
    next(error);
  }
};





const shopdetailsLoad = async (req, res,next) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    const products = await Product.find({});
    const totalRatings = product.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating =
      product.reviews.length > 0 ? totalRatings / product.reviews.length : 0;

    res.render("shopdetails", {
      product,
      user: req.session.user_id,
      averageRating,
      products,
    });
  } catch (error) {
    next(error);
  }
};
const reviewLoad = async (req, res,next) => {
  try {
    const productId = req.params.productId;
console.log(productId)
    const product = await Product.findById(productId);
  
   console.log(product)

    res.render("review", {
      product,
      user: req.session.user_id,
      
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res,next) => {
  try {
    if (req.session.user_id) {
      const productId = req.body.id;
      const userId = req.session.user_id;

      const userData = await userModel.findById(userId);
      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }

      const productData = await Product.findById(productId);
      if (!productData) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (productData.stock <= 0) {
        return res.json({ outofstock: true });
      }

      let userCart = await Cart.findOne({ user: userId });

      if (!userCart) {
        userCart = new Cart({ user: userId, products: [] });
      }

      const existingProductIndex = userCart.products.findIndex(
        (product) => String(product.productId) === String(productId)
      );

      if (existingProductIndex !== -1) {
        const existingProduct = userCart.products[existingProductIndex];

        if (productData.stock <= existingProduct.quantity) {
          return res.json({ outofstock: true });
        } else {
          existingProduct.quantity += 1;
        }
      } else {
        userCart.products.push({
          productId: productId,
          price:
            productData.discountedAmount > 0
              ? productData.discountedAmount
              : productData.product_price,
          quantity: 1,
        });
      }
      req.session.cart_count += 1;
      await userCart.save();

      res.json({ success: true });
    } else {
      res.json({ loginRequired: true });
    }
  } catch (error) {
    next(error);
  }
};

const getCartProducts = async (req, res,next) => {
  try {
    if (req.session.user_id) {
      const userId = req.session.user_id;
      const cartData = await Cart.findOne({ user: userId }).populate(
        "products.productId"
      );

      if (cartData && cartData.products.length > 0) {
        let total = 0;

        cartData.products.forEach((product) => {
          let priceToUse = product.productId.product_price;

          if (product.productId.discountedAmount > 0) {
            priceToUse = product.productId.discountedAmount;
          }

          total += product.quantity * priceToUse;
        });

        res.render("cart", {
          user: req.session.user_id,
          userId: userId,
          cart: cartData.products,
          total: total,
        });
      } else {
        res.render("cart", { user: req.session.user_id, cart: [], total: 0 });
      }
    } else {
      res.redirect("/login?errors=Please log in to view");
    }
  } catch (error) {
    next(error);
  }
};

const cartQuantity = async (req, res,next) => {
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

    if (quantity + count >= 1) {
      if (productData.stock < quantity + count) {
        res.json({
          success: false,
          message: "Quantity exceeds available stock",
        });
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
    next(error);
  }
};

const removeProductRouteHandler = async (req, res,next) => {
  try {
    const proId = req.body.product;
    const user = req.session.user_id;
    const userId = user._id;

    const cartData = await Cart.findOneAndUpdate(
      { "products.productId": proId },
      { $pull: { products: { productId: proId } } }
    );

    if (cartData) {
      res.json({ success: true });
    } else {
      res.json({ error: "Product not found in the cart" });
    }
  } catch (error) {
    next(error);
  }
};

const loadCheckout = async (req, res, next) => {
  try {
    let date = new Date();
    const userId = req.session.user_id;

    const userData = await userModel.findById(userId);

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "products.productId",
      model: "product",
    });

    const coupons = await Coupon.find();

    if (!cart || cart.products.length === 0) {
      return res.redirect("/view-cart");
    }

    const stockExceeded = cart.products.some((product) => {
      return product.quantity > product.productId.stock;
    });

    if (stockExceeded) {
      return res.redirect("/view-cart");
    }

    const addresses = await Address.findOne({ user_id: userId });

    let total = 0;

    cart.products.forEach((product) => {
      let priceToUse = product.productId.product_price;

      if (product.productId.discountedAmount > 0) {
        priceToUse = product.productId.discountedAmount;
      }

      total += product.quantity * priceToUse;
    });

    let appliedCoupon = null;
    let discount = null;
    if (req.query.appliedCoupon) {
      appliedCoupon = req.query.appliedCoupon;
      const coupon = await Coupon.findOne({ code: appliedCoupon });
      discount = coupon.discountPercentage;
    }

    let error = null;

    if (req.query.error) {
      error = req.query.error;
    }

    const userAddresses = addresses ? addresses.address : null;

    res.render("checkout", {
      user: req.session.user_id,
      cart,
      addresses: userAddresses,
      total,
      userData,
      appliedCoupon,
      discount,
      error,
      updatedTotal: req.session.total,
      coupons,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,

    });
  } catch (err) {
    next(err);
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    let date = new Date();
    const userId = req.session.user_id;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "products.productId",
      model: "product",
    });

    let total = 0;

    cart.products.forEach((product) => {
      let priceToUse = product.productId.product_price;

      if (product.productId.discountedAmount > 0) {
        priceToUse = product.productId.discountedAmount;
      }

      total += product.quantity * priceToUse;
    });

    const couponCode = req.body.couponCode;
    req.session.couponCode = couponCode;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });

      if (coupon && coupon.startDate <= date && date <= coupon.expireDate) {
        if (coupon.user.includes(userId)) {
          return res.redirect("/checkout?error=already-used-coupon");
        }
        if (total < coupon.minPurchaseAmount) {
          return res.redirect("/checkout?error=insufficient-purchase");
        }
        const discountAmount = (total * coupon.discountPercentage) / 100;
        total -= discountAmount;
        req.session.total = total;

        return res.redirect(
          `/checkout?appliedCoupon=${couponCode}&updatedTotal=${total}`
        );
      } else {
        return res.redirect("/checkout?error=invalid-coupon");
      }
    }

    res.redirect("/checkout");
  } catch (err) {
    next(err);
  }
};

const removeCoupon = (req, res,next) => {
  try {
    delete req.session.couponCode;
    delete req.session.total;
    return res.redirect("/checkout?couponRemoved=true");
  } catch (error) {
    next(error);
  }
};

const addShippingAddress = async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      return res.status(401).send("User not authenticated");
    }

    const userId = req.session.user_id;

    const address = await Address.findOne({ user_id: userId });

    if (address) {
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
              state: req.body.state,
            },
          },
        }
      );
    } else {
      const newAddress = new Address({
        user_id: userId,
        address: [
          {
            fullname: req.body.fullname,
            mobile: req.body.mobile,
            housename: req.body.housename,
            pin: req.body.pin,
            city: req.body.city,
            district: req.body.district,
            state: req.body.state,
          },
        ],
      });

      const saveResult = await newAddress.save();
    }

    res.redirect("/checkout");
  } catch (err) {
    next(err);
  }
};

const editAddressPagecheckout = async (req, res,next) => {
  try {
    const userId = req.session.user_id;
    const usersData = await takeUserData(userId);
    const addressId = req.params.addressId;

    const address = await Address.findOne({ user_id: userId });

    if (usersData && address) {
      res.render("editaddresscheckout", {
        users: usersData,
        address: address,
        addressId: addressId,
        user: req.session.user_id,
      });
    } else {
      res.redirect("/checkout");
    }
  } catch (error) {
    next(error);
  }
};

const editAddresscheckout = async (req, res,next) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.body.addressId;
    const existingAddress = await Address.findOne({
      user_id: userId,
      "address._id": addressId,
    });

    if (existingAddress) {
      const targetAddress = existingAddress.address.find(
        (addressItem) => addressItem._id.toString() === addressId
      );

      if (targetAddress) {
        targetAddress.fullname = req.body.fullname;
        targetAddress.mobile = req.body.mobile;
        targetAddress.housename = req.body.housename;
        targetAddress.city = req.body.city;
        targetAddress.state = req.body.state;
        targetAddress.district = req.body.district;
        targetAddress.pin = req.body.pin;

        await existingAddress.save();

        res.redirect("/checkout");
      } else {
        res.redirect("/checkout");
      }
    } else {
      res.redirect("/checkout");
    }
  } catch (error) {
    next(error);
  }
};

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const calculateTotalPrice = async (userId) => {
  try {
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.productId"
    );

    if (!cart) {
      return 0;
    }

    let totalPrice = 0;
    for (const cartProduct of cart.products) {
      const { productId, quantity } = cartProduct;
      const productPrice =
        productId.discountedAmount > 0
          ? productId.discountedAmount
          : productId.product_price;
      const productSubtotal = productPrice * quantity;
      totalPrice += productSubtotal;
    }

    return totalPrice;
  } catch (error) {
    return 0;
  }
};

const placeOrder = async (req, res,next) => {
  try {
    const addressId = req.body.address;
    const paymentType = req.body.payment;

    if (!addressId || !paymentType) {
      return res.status(400).json({ error: "Invalid address or payment type" });
    }

    const userId = req.session.user_id;
    const cartDetails = await Cart.findOne({ user: userId });

    const userAddrs = await Address.findOne({ user_id: userId });

    if (!userAddrs || !userAddrs.address || userAddrs.address.length === 0) {
      return res.status(400).json({ error: "User addresses not found" });
    }

    const shipAddress = userAddrs.address.find((address) => {
      return address._id.toString() === addressId.toString();
    });

    if (!shipAddress) {
      return res.status(400).json({ error: "Address not found" });
    }

    let cartProducts = cartDetails.products.map((productItem) => ({
      productId: productItem.productId,
      quantity: productItem.quantity,
      orderStatus: "Placed",

      returnOrder: {
        status: false,
        returnStatus: "Placed",
      },
      price: productItem.price,
    }));

    let total;
    let couponDiscount = 0;
    if (req.session.couponCode) {
      total = req.session.total;
      const coupon = await Coupon.findOne({ code: req.session.couponCode });
      couponDiscount = coupon.discountPercentage;
      var couponCode = req.session.couponCode;

      cartDetails.products.forEach((productItem) => {
        const discountedAmount = (couponDiscount / 100) * productItem.price;
        const discountedPrice = productItem.price - discountedAmount;
        productItem.price = discountedPrice;
      });

      cartProducts = cartDetails.products.map((productItem) => ({
        productId: productItem.productId,
        quantity: productItem.quantity,
        orderStatus: "Placed",
        returnOrder: {
          status: false,
          returnStatus: "Placed",
        },
        price: productItem.price,
      }));

      delete req.session.couponCode;
      delete req.session.total;
    } else {
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
      couponCode: couponCode,
      couponDiscount: couponDiscount,
      orderDate: new Date(),
      expectedDelivery: deliveryDate,
    });

    let placeorder;

    if (paymentType === "COD" || paymentType === "Wallet") {
      if (paymentType === "Wallet") {
        const userdetails = await userModel.findOne({
          _id: req.session.user_id,
        });
        if (userdetails.wallet < total) {
          return res.status(400).json({ error: "Insufficient wallet balance" });
        }

        const walletHistory = {
          date: new Date(),
          amount: total,
          description: "Order placed using Wallet",
          transactionType: "Debit",
        };

        await userModel.findByIdAndUpdate(
          { _id: userId },
          {
            $inc: {
              wallet: -total,
            },
            $push: {
              walletHistory,
            },
          }
        );
        for (const item of cartDetails.products) {
          const productId = item.productId._id;
          const quantity = parseInt(item.quantity, 10);
          await Product.findByIdAndUpdate(
            { _id: productId },
            { $inc: { stock: -quantity } }
          );
        }
      } else {
        for (const item of cartDetails.products) {
          const productId = item.productId._id;
          const quantity = parseInt(item.quantity, 10);

          await Product.findByIdAndUpdate(
            { _id: productId },
            { $inc: { stock: -quantity } }
          );
        }
      }

      order.status = true;
      placeorder = await order.save();

      if (couponCode) {
        await Coupon.findOneAndUpdate(
          { code: couponCode },
          { $push: { user: userId } }
        );
      }

      res
        .status(200)
        .json({ placeorder, message: "Order placed successfully" });

      await Cart.findOneAndDelete({ user: userId });
    } else if (paymentType === "Razorpay") {
      placeorder = await order.save();
      const orderId = placeorder._id;

      const options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
      };

      instance.orders.create(options, async function (err, order) {
        if (err) {
          return razorPaymentFailed(res, "Razorpay order creation failed");
        }

        for (const item of cartDetails.products) {
          const productId = item.productId._id;
          const quantity = parseInt(item.quantity, 10);

          await Product.findByIdAndUpdate(
            { _id: productId },
            { $inc: { stock: -quantity } }
          );
        }

        res.status(200).json({ order });
        if (couponCode) {
          await Coupon.findOneAndUpdate(
            { code: couponCode },
            { $push: { user: userId } }
          );
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res,next) => {
  try {
    const cartData = await Cart.findOne({ user: req.session.user_id });
    const details = req.body;

    const hmac = crypto.createHmac("sha256", instance.key_secret);
    hmac.update(
      details.payment.razorpay_order_id +
        "|" +
        details.payment.razorpay_payment_id
    );
    const hmacValue = hmac.digest("hex");

    if (hmacValue !== details.payment.razorpay_signature) {
      await Order.findByIdAndRemove({ _id: details.order.receipt });
      return res.json({
        success: false,
        message: "Signature verification failed",
      });
    }

    for (const product of cartData.products) {
      await Product.findByIdAndUpdate(
        { _id: product.productId },
        { $inc: { quantity: -product.quantity } }
      );
    }

    const orderId = details.order.receipt;
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        "products.$[].paymentStatus": "Success",
        paymentId: details.payment.razorpay_payment_id,
      },
    });

    await Cart.deleteOne({ user: req.session.user_id });

    await Order.findByIdAndUpdate(orderId, { $set: { status: true } });

    res.json({ codsuccess: true, orderid: orderId });
  } catch (error) {
    next(error);
  }
};

const orderPlaced = async (req, res,next) => {
  try {
    res.render("orderplaced", { user: req.session.user_id });
  } catch (error) {
    next(error);

  }
};

const loadaddwallet = async (req, res,next) => {
  try {
    res.render("wallet", { user: req.session.user_id,razorpayKeyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    next(error);

  }
};
const loadwalletHistory = async (req, res,next) => {
  try {
    const userId = req.session.user_id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("wallethistory", {
      walletHistory: user.walletHistory,
      user: req.session.user_id,
    });
  } catch (error) {
    next(error);

  }
};

const addMoneyWallet = async (req, res,next) => {
  try {
    const { amount } = req.body;
    const id = crypto.randomBytes(8).toString("hex");
    var options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "" + id,
    };

    instance.orders.create(options, (err, order) => {
      if (err) {
        res.json({ status: false });
      } else {
        res.json({ status: true, order: order });
      }
    });
  } catch (error) {
    next(error);

  }
};

const verifyWalletpayment = async (req, res,next) => {
  try {
    const userId = req.session.user_id;

    const body = req.body;
    const amount = parseInt(body.order.amount) / 100;
    let hmac = crypto.createHmac("sha256", instance.key_secret);

    hmac.update(
      body.payment.razorpay_order_id + "|" + body.payment.razorpay_payment_id
    );
    hmac = hmac.digest("hex");
    if (hmac == body.payment.razorpay_signature) {
      const walletHistory = {
        date: new Date(),
        description: "Deposited via Razorpay",
        transactionType: "Credit",
        amount: amount,
      };
      await userModel.findByIdAndUpdate(
        { _id: userId },
        {
          $inc: {
            wallet: amount,
          },
          $push: {
            walletHistory,
          },
        }
      );

      const updatedUser = await userModel.findById(userId);
      res.json({ status: true, wallet: updatedUser.wallet });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    next(error);

  }
};

const loadWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({
      user: req.session.user_id,
    }).populate("products.productId");
    res.render("wishlist", { user: req.session.user_id, wish: wishlist });
  } catch (err) {
    next(err);
  }
};

const addWishlist = async (req, res, next) => {
  try {
    const product = req.body.proId;
    const userId = req.session.user_id;

    if (userId === undefined) {
      res.json({ NoUser: true });
    }

    const wishData = await Wishlist.findOne({ user: userId });

    if (wishData) {
      const existProduct = await Wishlist.findOne({
        user: userId,
        "products.productId": product,
      });

      if (existProduct) {
        res.json({ success: false, message: "Product already exists" });
      } else {
        await Wishlist.findOneAndUpdate(
          { user: userId },
          { $push: { products: { productId: product } } }
        );

        res.json({ success: true });
      }
    } else {
      const wishlist = new Wishlist({
        user: userId,
        products: [
          {
            productId: product,
          },
        ],
      });

      const newWish = await wishlist.save();

      if (newWish) {
        req.session.wishlist_count += 1;

        res.json({ success: true });
      } else {
        res.json({ success: false, message: "Something went wrong" });
      }
    }
  } catch (err) {
    next(err);
  }
};

const deleteWishlist = async (req, res, next) => {
  try {
    const productId = req.body.proId;
    const wishData = await Wishlist.findOne({ user: req.session.user_id });

    if (wishData.products.length === 1) {
      await Wishlist.deleteOne({ user: req.session.user_id });

      res.json({ success: true });
    } else {
      await Wishlist.findOneAndUpdate(
        { user: req.session.user_id },
        {
          $pull: { products: { productId: productId } },
        }
      );

      res.json({ success: true });
    }
  } catch (err) {
    next(err);
  }
};

const submitReview = async (req, res, next) => {
  try {
    const { productId, rating, comment, userId } = req.body;

    if (rating < 1 || rating > 5) {
      return res.json({
        success: false,
        message: "Invalid rating. Please select a rating between 1 and 5.",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.json({ success: false, message: "Product not found." });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "Login to review." });
    }

    const existingReview = product.reviews.find(
      (review) => review.user.userId === userId
    );

    if (existingReview) {
      return res.json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }

    const deliveredOrder = await Order.findOne({
      "cart.products.productId": productId,
      "cart.products.orderStatus": "Delivered",
      user: userId,
    });

    if (!deliveredOrder) {
      return res.json({
        success: false,
        message: "You can only review or rate a product after receiving it.",
      });
    }

    product.reviews.push({
      user: {
        userId: userId,
        username: user.username,
      },
      rating,
      comment,
      date: new Date(),
    });

    await product.save();

    res.json({ success: true, message: "Review submitted successfully!" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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

  homeLoad,
  shopLoad,
  aboutLoad,
  faqLoad,
  contactLoad,

  shopdetailsLoad,
  reviewLoad,
  submitReview,

  addToCart,
  getCartProducts,
  cartQuantity,
  removeProductRouteHandler,

  loadWishlist,
  addWishlist,
  deleteWishlist,

  loadCheckout,

  addShippingAddress,
  editAddressPagecheckout,
  editAddresscheckout,

  applyCoupon,
  removeCoupon,

  placeOrder,
  verifyPayment,
  orderPlaced,

  profileLoad,
  allordersLoad,
  orderDetails,
  invoiceDownload,
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
};
