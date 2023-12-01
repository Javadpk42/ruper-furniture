const adminModel = require("../model/adminModel")
const userModel = require("../model/userModel")
const mongoose=require("mongoose")



const { ObjectId } = require('mongoose').Types;

const Category = require("../model/productModel").category;
const { category } = require("../model/productModel");

const Order = require("../model/orderModel")
const Coupon = require("../model/couponModel")
const Banner = require("../model/bannerModel")

const Product = require('../model/productModel').product;

const bcrypt=require('bcrypt');
const { name } = require('ejs');
const fs = require('fs');
const { Parser } = require('json2csv');
const moment = require('moment');

const path=require("path")

const securePassword = async (password) => {
  try {
      const passwordHash = await bcrypt.hash(password, 10);
      return passwordHash;
  } catch (error) {
      console.log(error.message);
  }
};

const loginLoad=async(req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message )
    }
}
const adminLogout=async(req,res)=>{
  try {
      req.session.destroy()
      res.redirect('/admin')
  } catch (error) {
      console.log(error.message)
  }
}
const verifyLogin=async(req,res)=>{
  try{
      const email=req.body.email
      const password=req.body.password

      const adminData=await adminModel.findOne({email:email})
      if(adminData){
          const passwordMatch=await bcrypt.compare(password,adminData.password)
          if (passwordMatch) {
              if (adminData.is_admin===0) {
                  res.render('login',{message:"Email and password is incorrect"})
              } else {
                  req.session.admin_id=adminData._id
                  res.redirect('/admin/dashboard')
              } 
          } else {
              res.render('login',{message:"Email and password is incorrect"})
          }
      }
      else{
          res.render('login',{message:"Email and password is incorrect"})
      }
  }
  catch(error){
     console.log(error.message)
  }
}


const usersLoad = async (req, res) => {
  try {
    const { search } = req.query;

    // Pagination settings
    const page = req.query.page || 1;
    const limit = 5;

    // Calculate skip value based on page and limit
    const skip = (page - 1) * limit;

    let users;

    if (search) {
      // Fetch users with search and pagination
      users = await userModel
        .find({ username: { $regex: '.*' + search + '.*', $options: 'i' } })
        .skip(skip)
        .limit(limit);
    } else {
      // Fetch all users with pagination
      users = await userModel.find().skip(skip).limit(limit);
    }

    // Get total count of users (for calculating totalPages)
    const totalCount = await userModel.countDocuments();

    res.render('customers', {
      userss: users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      search: search, // Add search to your render data
    });
  } catch (error) {
    console.log(error);
  }
};



const blockOrNot = async (req, res) => {
  try {
    const id = req.body.id;
    const userData = await userModel.findOne({ _id: id });

    // Check if the user is currently logged in (session exists)
    if (req.session && req.session.user_id && req.session.user_id.toString() === id.toString()) {
      // Clear the session to log out the user
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
      });
    } 

    // Update the is_verified status
    if (userData.is_verified === true) {
      await userModel.updateOne(
        { _id: id },
        { $set: { is_verified: false } }
      );
    } else {
      await userModel.updateOne({ _id: id }, { $set: { is_verified: true } });
    }

    res.redirect("/admin/customers");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
  

  

  
  const categoryLoad = async (req, res) => {
    try {
      const search = req.query.search || ''; // Get search query from request parameters
      const page = parseInt(req.query.page) || 1; // Get page number from request parameters, default to 1
      const limit = 5; // Set the number of items per page
  
      let categories;
      let count;
  
      if (search) {
        categories = await Category.find({
          $or: [
            { category_name: { $regex: '.*' + search + '.*', $options: 'i' } },
            { category_description: { $regex: '.*' + search + '.*', $options: 'i' } },
          ],
        })
          .skip((page - 1) * limit)
          .limit(limit);
  
        count = await Category.find({
          $or: [
            { category_name: { $regex: '.*' + search + '.*', $options: 'i' } },
            { category_description: { $regex: '.*' + search + '.*', $options: 'i' } },
          ],
        }).countDocuments();
      } else {
        categories = await Category.find({})
          .skip((page - 1) * limit)
          .limit(limit);
  
        count = await Category.countDocuments({});
      }
  
      const totalPages = Math.ceil(count / limit);
  
      res.render("categories", {
        categories: categories,
        search: search,
        currentPage: page,
        totalPages: totalPages,
      }); // Pass search query and pagination details to the template
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  };
  

  const unlistCategory = async (req, res) => {
    try {
      const id = req.body.id; // Use req.body to get the category ID from the form submission
      const category = await Category.findById(id);
  
      if (category) {
        category.is_listed = !category.is_listed;
        await category.save();
      }
  
      const categories = await Category.find({});
      res.redirect("/admin/categories");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error"); // Handle the error appropriately
    }
  };
  


  const addcategoryLoad = async (req, res) => {
    try {
      res.render("addcategories");
    } catch (error) {
      console.log(error);
    }
  };


 

const addCategory = async (req, res) => {
  try {
      console.log(req.body);

      // Convert the category name to lowercase for case-insensitive comparison
      const categoryName = req.body.category_name.toLowerCase();

      // Check if a category with the same name already exists (case-insensitive)
      const existingCategory = await Category.findOne({
          category_name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
      });

      if (existingCategory) {
          return res.render('addcategories', { message: "Category Already Created" });
      }

      let category = await new Category({
          category_name: req.body.category_name,  // Save the original case
          category_description: req.body.category_description,
          is_listed: true,
      });

      let result = await category.save();
      console.log(result);
      res.redirect("/admin/categories");
  } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
  }  
};


const editCategoryLoad = async (req, res) => {
  try {
    const categoryId = req.query.id;
    const categoryDetails = await Category.find({ _id: categoryId });
    console.log(categoryDetails);
    res.render("editCategories", { categories: categoryDetails });
  } catch (error) {
    console.log(error);
  }
};


const   updateCategoryData = async (req, res) => {
  try {
    let categoryData = req.body;
    let updateCategory = await Category.updateOne(
      { _id: req.query.id },
      {
        $set: {
          category_name: categoryData.category_name,
          category_description: categoryData.category_description,
        },
      }
    );
    console.log(updateCategory);
    res.redirect("/admin/categories");
  } catch (error) {
    console.log(error);
  }
}; 












const editproductLoad=async(req,res)=>{
  try{
      const id=req.query.id
      const productData=await productModel.findById({_id:id})
      if(productData){
          res.render('editproducts',{product:productData})
      }
      else{
          res.redirect('/admin/products')
      }
     
  } 
  catch(error){
     console.log(error.message)
  }
}
const updateproducts=async(req,res)=>{
  try{
     const productData=await productModel.findByIdAndUpdate({_id:req.body.id},{$set:{name:req.body.name}})
      res.redirect('/admin/products')
  }
  catch(error){
     console.log(error.message)
  }
}




const orderLoad = async (req, res) => {
  try {
    // Fetch all orders with user information
    const orders = await Order.find({})
      .sort({ orderDate: -1 })
      .populate({
        path: 'user',
        model: 'User',
        select: 'username' // Select the fields you want to populate
      });

    // Check if orders data is not null or undefined
    if (orders) {
      res.render('orders', { orders });
    } else {
      console.log('Orders Data is null or undefined');
      res.render('orders', { orders: [] });
    }
  } catch (error) {
    console.log(error);
    res.render('orders', { orders: [], error: 'Error fetching orders data' });
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
    const { cart, deliveryAddress, paymentOption, totalAmount, orderDate} = order;

    // Render order details view with order data
    res.render('orderdetailsadmin', {
      order: { 
        _id: order._id,
        
        cart,
        deliveryAddress,
        paymentOption,
        totalAmount,
        orderDate,
      
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error fetching order details' });
  }
};





const updateOrderStatus = async (req, res) => {
  try {
    const productId = req.params.orderId;
    const newStatus = req.body.status;
   

    // Find the order containing the product
    const order = await Order.findOne({ 'cart.products._id': new mongoose.Types.ObjectId(productId) });

    // Check if the order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Find the product within the order and update its status
    const product = order.cart.products.find(product => product._id.toString() === productId);
    if (product) {
      product.orderStatus = newStatus;

      // Update statusLevel based on newStatus
      switch (newStatus) {
        case 'Shipped':
          product.statusLevel = 2;
          break;
        case 'Out for delivery':
          product.statusLevel = 3;
          break;
        case 'Delivered':
          product.statusLevel = 4;
          break;
        // Add more cases if needed

        default:
          // Handle other status cases
          break;
      }

      await order.save();
    } else {
      return res.status(404).json({
        success: false,
        message: 'Product not found in order',
      });
    }

    // Redirect back to the order details page or orders page
    res.redirect('/admin/orders');
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

// const updateReturnStatus = async (req, res) => {
//   try {
//     const productId = req.params.orderId;
//     const newStatus = req.body.returnstatus;

//     console.log(newStatus)

//     // Find the order containing the product
//     const order = await Order.findOne({ 'cart.products._id': new mongoose.Types.ObjectId(productId) });

//     // Check if the order exists
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }

//     // Find the product within the order and update its status
//     const product = order.cart.products.find(product => product._id.toString() === productId);
//     if (product) {
//       product.returnOrder.returnStatus = newStatus;

//       // Update statusLevel based on newStatus
//       switch (newStatus) {
//         case 'Out for pickup':
//           product.returnOrder.statusLevel = 2;
//           break;
//         case 'Returned':
//           product.returnOrder.statusLevel = 3;
//           break;
//         case 'Refund':
//           product.returnOrder.statusLevel = 4;
//           break;
//         // Add more cases if needed

//         default:
//           // Handle other status cases
//           break;
//       }

//       await order.save();
//     } else {
//       return res.status(404).json({
//         success: false,
//         message: 'Product not found in order',
//       });
//     }

//     // Redirect back to the order details page or orders page
//     res.redirect('/admin/orders');
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Failed to update return status' });
//   }
// };

const updateReturnStatus = async (req, res) => {
  try {
    
    const productId = req.params.orderId;
    const newStatus = req.body.returnstatus;
    console.log(productId)
    console.log(newStatus)

    // Find the order containing the product
    const order = await Order.findOne({ 'cart.products._id': new mongoose.Types.ObjectId(productId) });

    // Check if the order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Find the product within the order and update its status
    const product = order.cart.products.find(product => product._id.toString() === productId);
    if (product) {
      product.returnOrder.returnStatus = newStatus;

      // Update statusLevel based on newStatus
      switch (newStatus) {
        case 'Out for pickup':
          product.returnOrder.statusLevel = 2;
          break;
        case 'Returned':
          product.returnOrder.statusLevel = 3;
          break;
        case 'Refund':
          product.returnOrder.statusLevel = 4;

          // Fetch the product by ID to get its price
          // const refundedProduct = await Product.findById(product.productId);
          const refundedProduct= product

          // Increase user's wallet balance
          const user = await userModel.findById(order.user);
          const refundAmount = refundedProduct.price;
          user.wallet += refundAmount;
          await user.save();

          // Update wallet history
          user.walletHistory.push({
            date: new Date(),
            amount: refundAmount,
            description: `Refund from order return ${order._id}`,
            transactionType: 'credit',
          });

          await user.save();

          break;
        // Add more cases if needed

        default:
          // Handle other status cases
          break;
      }

      await order.save();
    } else {
      return res.status(404).json({
        success: false,
        message: 'Product not found in order',
      });
    }

    // Redirect back to the order details page or orders page
    res.redirect('/admin/orders');
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update return status' });
  }
};


const couponLoad = async (req, res) => {
  try {
    const couponData = await Coupon.find()
    res.render('coupon', { couponData })
  } catch (error) {
    console.log(error);
  }
};

const couponAdd = async (req, res,next) => {
  try {
    res.render('addcoupon')
  } catch (err) {
  next(err)
  }
}

const couponSet = async (req, res,next) => {
  try {


    const code = req.body.code
    const already = await Coupon.findOne({ code: code })

    if (already) {
      res.render('coupon_admin', { message: 'code already exists' })
    } else {
      const newCoupon = new Coupon({
        code: req.body.code,
        discountPercentage: req.body.discountPercentage,
        startDate: req.body.startDate,
        expireDate: req.body.expiryDate,
        minPurchaseAmount:req.body.minPurchaseAmount,
      })

      await newCoupon.save()
      res.redirect('/admin/coupons')

    }


  } catch (err) {
  next(err)
  }
}

const deleteCoupon = async (req, res,next) => {
  try {
    const id = req.body.id
    await Coupon.findByIdAndDelete({ _id: id })
    console.log('hai');
    res.json({ success: true })
  } catch (err) {
  next(err)
  }
}
const loadCouponEdit=async(req,res,next)=>{
  try {
    const id=req.query.id
    const couponData=await Coupon.findById({_id:id})
  res.render('couponEdit',{data:couponData})
    
  } catch (err) {
    next(err)
  }
}

const editCoupon=async(req,res,next)=>{
  try {
    const id=req.body.id
const    code= req.body.code
const discountPercentage= req.body.discountPercentage
const startDate= req.body.startDate
const  expireDate= req.body.expiryDate
    await Coupon.findByIdAndUpdate({_id:id},{$set:{code:code,discountPercentage:discountPercentage,startDate:startDate,expireDate:expireDate}})
    res.redirect('/admin/coupons')
  } catch (err) {
    next(err)
  }
}

// const loaddashboard = async (req, res, next) => {
//   try {
//     // Fetch the total number of products
//     const totalProducts = await Product.countDocuments();

//     // Fetch the total number of categories
//     const totalCategories = await Category.countDocuments();

//     // Fetch the total number of users
//     const totalUsers = await userModel.countDocuments();

//     // Fetch the total revenue
//     const totalRevenue = await Order.aggregate([
//       {
//         $match: {
//           status: { $ne: "pending" },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           totalAmount: { $sum: "$totalAmount" },
//         },
//       },
//     ]);

//     const revenue = totalRevenue.length > 0 ? totalRevenue[0].totalAmount : 0;

//     const totalOrders = await Order.countDocuments();

//     // Fetch data for payment methods
//     const paymentMethods = await Order.aggregate([
//       {
//         $group: {
//           _id: "$paymentOption",
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     const startDate = new Date();
//     startDate.setFullYear(startDate.getFullYear() - 1);

//     const dailyOrderCounts = await Order.aggregate([
//       {
//         $match: {
//           orderDate: { $gte: startDate },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             dayOfWeek: { $dayOfWeek: "$orderDate" },
//             weekOfYear: { $isoWeek: "$orderDate" },
//           },
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     // Map the daily order counts to a nested array
//     const dailyOrderCountsArray = Array(7).fill(0).map(() => Array(52).fill(0));

//     dailyOrderCounts.forEach((count) => {
//       const dayOfWeek = count._id.dayOfWeek - 1; // Adjust to 0-based index
//       const weekOfYear = count._id.weekOfYear - 1; // Adjust to 0-based index
//       dailyOrderCountsArray[dayOfWeek][weekOfYear] = count.count;
//     });


//     const dailyOrderLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
//     // Fetch the latest orders
//     const latestOrders = await Order.find().sort({ orderDate: -1 }).limit(5);

//     // Additional data fetching based on your needs...

//     const revenueChartData = await Order.aggregate([
//       {
//         $match: {
//           status: { $ne: "pending" },
//         },
//       },
//       {
//         $group: {
//           _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
//           amount: { $sum: "$totalAmount" },
//         },
//       },
//       {
//         $sort: {
//           _id: 1,
//         },
//       },
//     ]);

//     console.log("Revenue Chart Data:", revenueChartData);


//     // Render the dashboard view with the retrieved data
//     res.render('dashboard', {
//       totalProducts,
//       totalCategories,
//       totalUsers,
//       revenue,
//       latestOrders,
//       totalOrders,
//       paymentMethods,
//       dailyOrderCountsArray,
//       dailyOrderLabels,
//       revenueChartData,
//       // Add more data as needed...
//     });
//   } catch (err) {
//     next(err);
//   }
// };
 


// const loaddashboard = async (req, res, next) => {
//   try {
//     // Fetch the total number of products
//     const totalProducts = await Product.countDocuments();

//     // Fetch the total number of categories
//     const totalCategories = await Category.countDocuments();

//     // Fetch the total number of users
//     const totalUsers = await userModel.countDocuments();

//     // Fetch the total revenue
//     const totalRevenue = await Order.aggregate([
//       {
//         $match: {
//           status: { $ne: "pending" },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           totalAmount: { $sum: "$totalAmount" },
//         },
//       },
//     ]);

//     const revenue = totalRevenue.length > 0 ? totalRevenue[0].totalAmount : 0;

//     const totalOrders = await Order.countDocuments();

//     // Fetch data for payment methods
//     const paymentMethods = await Order.aggregate([
//       {
//         $group: {
//           _id: "$paymentOption",
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     const startDate = new Date();
//     startDate.setFullYear(startDate.getFullYear() - 1);

//     const dailyOrderCounts = await Order.aggregate([
//       {
//         $match: {
//           orderDate: { $gte: startDate },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             dayOfWeek: { $dayOfWeek: "$orderDate" },
//             weekOfYear: { $isoWeek: "$orderDate" },
//           },
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     // Map the daily order counts to a nested array
//     const dailyOrderCountsArray = Array(7).fill(0).map(() => Array(52).fill(0));

//     dailyOrderCounts.forEach((count) => {
//       const dayOfWeek = count._id.dayOfWeek - 1; // Adjust to 0-based index
//       const weekOfYear = count._id.weekOfYear - 1; // Adjust to 0-based index
//       dailyOrderCountsArray[dayOfWeek][weekOfYear] = count.count;
//     });

//     const dailyOrderLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
//     // Fetch the latest orders
//     const latestOrders = await Order.find().sort({ orderDate: -1 }).limit(5);

//     // Fetch the revenue chart data
//     const revenueChartData = await Order.aggregate([
//       {
//         $match: {
//           status: { $ne: "pending" },
//         },
//       },
//       {
//         $group: {
//           _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
//           amount: { $sum: "$totalAmount" },
//         },
//       },
//       {
//         $sort: {
//           _id: 1,
//         },
//       },
//     ]);

//     // Format the dates in the revenue chart data
//     const formattedRevenueChartData = revenueChartData.map(entry => ({
//       date: moment(entry._id).format('YYYY-MM-DD'),
//       amount: entry.amount,
//     }));

//     console.log("Formatted Revenue Chart Data:", formattedRevenueChartData);

//     // Render the dashboard view with the retrieved data
//     res.render('dashboard', {
//       totalProducts,
//       totalCategories,
//       totalUsers,
//       revenue,
//       latestOrders,
//       totalOrders,
//       paymentMethods,
//       dailyOrderCountsArray,
//       dailyOrderLabels,
//       revenueChartData: formattedRevenueChartData,
//       // Add more data as needed...
//     });
//   } catch (err) {
//     next(err);
//   }
// };


const loaddashboard = async (req, res, next) => {
  try {
 

    const totalUsers = await userModel.countDocuments();
    // console.log("Total Users:", totalUsers);
    const totalOrders=await Order.countDocuments()
  
    const paymentMethodsData = await Order.aggregate([
      {
        $group: {
          _id: "$paymentOption",
          count: { $sum: 1 },
        },
      },
    ]);
    
    // console.log("Payment Methods Data:", paymentMethodsData);
    
    const paymentMethodsLabels = paymentMethodsData.map(method => method._id);
    const paymentMethodsCount = paymentMethodsData.map(method => method.count);
    
    // console.log("Payment Methods Labels:", paymentMethodsLabels);
    // console.log("Payment Methods Count:", paymentMethodsCount);


    const allOrdersRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    // console.log("All Orders Revenue:", allOrdersRevenue);

    const totalAllOrdersRevenue = allOrdersRevenue.length > 0 ? allOrdersRevenue[0].totalAmount : 0;
    // console.log("Total All Orders Revenue:", totalAllOrdersRevenue);
    const averageOrderValue =totalAllOrdersRevenue > 0 ? totalAllOrdersRevenue / totalOrders : 0;
//
    const revenueOrders = await Order.aggregate([
      {
        $unwind: "$cart.products",
      },
      {
        $match: {
          $or: [
            { paymentOption: 'COD', 'cart.products.orderStatus': 'Delivered' },
            { paymentOption: { $in: ['Razorpay', 'Wallet'] }, 'cart.products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);
    // console.log("Aggregation Result (revenueOrders):", revenueOrders);
    
    const totalRevenue = revenueOrders.length > 0 ? revenueOrders[0].totalAmount : 0;
    // console.log("Total Revenue:", totalRevenue);

   //
 

    // console.log("Formatted Revenue Chart Data:", formattedweeklyRevenueChartData); 
//

const revenuePerProduct = await Order.aggregate([
  {
    $unwind: "$cart.products",
  },
  {
    $match: {
      $or: [
        { paymentOption: 'COD', 'cart.products.orderStatus': 'Delivered' },
        { paymentOption: { $in: ['Razorpay', 'Wallet'] }, 'cart.products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] } },
      ],
    },
  },
  {
    $group: {
      _id: '$cart.products.productId',
      totalAmount: { $sum: { $multiply: ['$cart.products.price', '$cart.products.quantity'] } },
    },
  },
]);

// console.log("Revenue Per Product:", revenuePerProduct);

const productIds = revenuePerProduct.map(product => product._id);

// console.log("Product IDs:", productIds);

// Fetch all products (including those with zero revenue)
const allProducts = await Product.find({}, 'product_name');

// console.log("All Products:", allProducts);

const productMap = new Map(allProducts.map(product => [product._id.toString(), product]));

// Map product names and revenues
const productData = allProducts.map(product => {
  const revenueProduct = revenuePerProduct.find(rp => rp._id.toString() === product._id.toString());
  return {
    name: product.product_name,
    revenue: revenueProduct ? revenueProduct.totalAmount : 0,
  };
});

// Sort products by revenue in descending order
const sortedProducts = productData.sort((a, b) => b.revenue - a.revenue);

// Take only the top 3 products
const top3Products = sortedProducts.slice(0, 3);

console.log("Top 3 Products:", top3Products);

const productLabels = top3Products.map(product => product.name);
const productRevenues = top3Products.map(product => product.revenue);

// console.log("Product Labels:", productLabels);
// console.log("Product Revenues:", productRevenues);




const revenuePerCategory = await Order.aggregate([
  {
    $unwind: "$cart.products",
  },
  {
    $match: {
      $or: [
        { paymentOption: 'COD', 'cart.products.orderStatus': 'Delivered' },
        { paymentOption: { $in: ['Razorpay', 'Wallet'] }, 'cart.products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] } },
      ],
    },
  },
  {
    $lookup: {
      from: 'products', // Assuming your product model is named 'products'
      localField: 'cart.products.productId',
      foreignField: '_id',
      as: 'productDetails',
    },
  },
  {
    $unwind: "$productDetails",
  },
  {
    $group: {
      _id: '$productDetails.category',
      totalAmount: { $sum: { $multiply: ['$cart.products.price', '$cart.products.quantity'] } },
    },
  },
]);

// console.log("Revenue Per Category:", revenuePerCategory);

// Fetch all categories
const allCategories = await Category.find({}, 'category_name');

// console.log("All Categories:", allCategories);

// Map category names and revenues
const categoryData = allCategories.map(category => ({
  name: category.category_name,
  revenue: revenuePerCategory.find(c => c._id === category.category_name)?.totalAmount || 0,
}));

// Sort categories by revenue in descending order
const sortedCategories = categoryData.sort((a, b) => b.revenue - a.revenue);

// Take all categories
const allCategoryLabels = allCategories.map(category => category.category_name);

console.log("All Category Labels:", allCategoryLabels);

// Take only the top 4 categories
const top4Categories = sortedCategories.slice(0, 4);

// console.log("Top 4 Categories:", top4Categories);

const categoryLabels = top4Categories.map(category => category.name);
const categoryRevenues = top4Categories.map(category => category.revenue);

// console.log("Category Labels:", categoryLabels);
// console.log("Category Revenues:", categoryRevenues);


const today = new Date();
const lastWeekStartDate = new Date(today);
lastWeekStartDate.setDate(today.getDate() - 7); // Get the start date of the last 7 days

const weeklyrevenueOrders = await Order.aggregate([
  {
    $match: {
      orderDate: { $gte: lastWeekStartDate, $lte: today },
      $or: [
        { paymentOption: 'COD', 'cart.products.orderStatus': 'Delivered' },
        { paymentOption: { $in: ['Razorpay', 'Wallet'] }, 'cart.products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] } },
      ],
    },
  },
  // {
  //   $unwind: "$cart.products",
  // },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
      totalAmount: { $sum: "$totalAmount" },
    },
  },
  {
    $sort: {
      _id: 1,
    },
  },
]);

console.log('wwwwww',weeklyrevenueOrders)

// Generate an array of all days of the last 7 days
const allDaysOfLastWeek = [];
let currentDate = new Date(lastWeekStartDate);
while (currentDate <= today) {
  allDaysOfLastWeek.push(currentDate.toISOString().split('T')[0]);
  currentDate.setDate(currentDate.getDate() + 1);
}

// Fill in the revenue data for each day, even if it's zero
const formattedWeeklyRevenueChartData = allDaysOfLastWeek.map(day => {
  const matchingEntry = weeklyrevenueOrders.find(entry => entry._id === day);
  return {
    date: day,
    amount: matchingEntry ? matchingEntry.totalAmount : 0,
  };
});

// Extract the labels (dates) and data (amounts) for the line chart
const weeklyRevenueLabels = formattedWeeklyRevenueChartData.map(entry => entry.date);
const weeklyRevenueData = formattedWeeklyRevenueChartData.map(entry => entry.amount);

console.log(weeklyRevenueData);
console.log(weeklyRevenueLabels);




// Fetch revenue data for each month
// Fetch revenue data for each month including today
const monthlyRevenueOrders = await Order.aggregate([
  {
    $match: {
      orderDate: { $lte: today },
      $or: [
        { paymentOption: 'COD', 'cart.products.orderStatus': 'Delivered' },
        { paymentOption: { $in: ['Razorpay', 'Wallet'] }, 'cart.products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] } },
      ],
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$orderDate" } },
      totalAmount: { $sum: "$totalAmount" },
    },
  },
  {
    $sort: {
      _id: 1,
    },
  },
]);

// Generate an array of all months from the start of the year to the current month
const allMonths = [];
let currentMonthDate = new Date(today.getFullYear(), 0, 1); // Start from January
while (currentMonthDate <= today) {
  allMonths.push(currentMonthDate.toISOString().split('T')[0].substring(0, 7)); // Format as "YYYY-MM"
  currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
}

// Fill in the revenue data for each month, even if it's zero
const formattedMonthlyRevenueChartData = allMonths.map(month => {
  const matchingMonthEntry = monthlyRevenueOrders.find(entry => entry._id === month);
  return {
    month: month,
    amount: matchingMonthEntry ? matchingMonthEntry.totalAmount : 0,
  };
});

// Calculate and add the revenue for the current month up to today
const currentMonth = today.toISOString().split('T')[0].substring(0, 7);
const currentMonthRevenue = monthlyRevenueOrders.reduce((total, entry) => {
  if (entry._id === currentMonth) {
    total += entry.totalAmount;
  }
  return total;
}, 0);

formattedMonthlyRevenueChartData.push({
  month: currentMonth,
  amount: currentMonthRevenue,
});

// Extract the labels (months) and data (amounts) for the line chart
const monthlyRevenueLabels = formattedMonthlyRevenueChartData.map(entry => entry.month);
const monthlyRevenueData = formattedMonthlyRevenueChartData.map(entry => entry.amount);

// console.log(monthlyRevenueData);
// console.log(monthlyRevenueLabels);



// Fetch revenue data for each year in the last five years
const fiveYearsRevenueOrders = await Order.aggregate([
  {
    $match: {
      orderDate: { $lte: today },
      $or: [
        { paymentOption: 'COD', 'cart.products.orderStatus': 'Delivered' },
        { paymentOption: { $in: ['Razorpay', 'Wallet'] }, 'cart.products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] } },
      ],
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y", date: "$orderDate" } },
      totalAmount: { $sum: "$totalAmount" },
    },
  },
  {
    $sort: {
      _id: 1,
    },
  },
]);

// Generate an array of all years in the last five years
const allYearsFiveYears = [];
let currentYearDateFiveYears = new Date(today.getFullYear() - 5, 0, 1); // Go back five years from January
while (currentYearDateFiveYears.getFullYear() <= today.getFullYear()) {
  allYearsFiveYears.push(currentYearDateFiveYears.toISOString().split('T')[0].substring(0, 4)); // Format as "YYYY"
  currentYearDateFiveYears.setFullYear(currentYearDateFiveYears.getFullYear() + 1);
}

// Fill in the revenue data for each year, even if it's zero
const formattedFiveYearsRevenueChartData = allYearsFiveYears.map(year => {
  const matchingYearEntry = fiveYearsRevenueOrders.find(entry => entry._id === year);
  return {
    year: year,
    amount: matchingYearEntry ? matchingYearEntry.totalAmount : 0,
  };
});

// Calculate and add the revenue for the current year up to today
const currentYear = today.toISOString().split('T')[0].substring(0, 4);
const currentYearRevenue = fiveYearsRevenueOrders.reduce((total, entry) => {
  if (entry._id === currentYear) {
    total += entry.totalAmount;
  }
  return total;
}, 0);

formattedFiveYearsRevenueChartData.push({
  year: currentYear,
  amount: currentYearRevenue,
});

// Extract the labels (years) and data (amounts) for the line chart
const yearlyRevenueLabels = formattedFiveYearsRevenueChartData.map(entry => entry.year);
const yearlyRevenueData = formattedFiveYearsRevenueChartData.map(entry => entry.amount);









res.render('dashboard', {
  totalUsers,
  totalRevenue,
  totalOrders,
  averageOrderValue,
  paymentMethodsCount,
  paymentMethodsLabels,
  productLabels,
  productRevenues,
  categoryLabels,
  categoryRevenues,
  weeklyRevenueData,
  weeklyRevenueLabels,
  monthlyRevenueData,
  monthlyRevenueLabels,
  yearlyRevenueData,
  yearlyRevenueLabels
  // Add more data as needed...
});

  } catch (err) {
    next(err);
  }
};



// const loaddashboard=async(req,res)=>{
//   try {
//       res.render('dashboard')
//   } catch (error) {
//       console.log(error.message )
//   }
// }

const offerLoad = async (req, res) => {
  try {
    
    res.render('offer', { })
  } catch (error) {
    console.log(error);
  }
};

const loadProductOffers=async (req,res)=>{
  try {
      // const nonOffer=await Product.find({blocked:false})
      const offer=await Product.find({discount:{$gt:0}})
      res.render('offerproduct',{offer})
  } catch (error) {
      console.log(error);
  }
}
const loadaddProductOffers=async (req,res)=>{
  try {
    const products = await Product.find({});
    console.log("prodsdf",products)
      res.render('addproductoffer',{products})
  } catch (error) {
      console.log(error);
  }
}
function calculateDiscountedPrice(originalPrice, discountPercentage) {
  const discountAmount = (discountPercentage / 100) * originalPrice;
  return originalPrice - discountAmount;
}

// const addProductOffers=async(req,res)=>{
//   try {
//       const productId = req.body.productId; 
//       const discount = req.body.discount;
      
//       const product = await Product.findById(productId);
//       const originalPrice = product.product_price;
//       const discountedAmount = calculateDiscountedPrice(originalPrice, discount);
//       product.discountedAmount = discountedAmount;
      
//       product.discount = discount;
//       await product.save();

     
//      res.redirect('/admin/product-offer')
//   } catch (error) {
//       console.log(error);
//   }
// }

const addProductOffers = async (req, res) => {
  try {
    const productId = req.body.productId;
    const discount = req.body.discount;

    const product = await Product.findById(productId);
    const originalPrice = product.product_price;
    const discountedAmount = calculateDiscountedPrice(originalPrice, discount);

    // Check if the new discount is greater than the existing one
    if (discountedAmount < product.discountedAmount || product.discountedAmount==0) {
      product.discountedAmount = discountedAmount;
    }
      product.discount = discount;
      await product.save();
    

    res.redirect('/admin/product-offer');
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// const removeOffer=async (req,res)=>{

//   try {
//     console.log(req.body.productId)
//       console.log('jkncjkjwcnjcwn',req.body.productId);
//       const productId=req.body.productId
//       // const product=await Product.findByIdAndUpdate({_id:productId},
//       //     {
//       //         $set:{discount:0,discountedAmount:0}
//       //     })
//       //     res.json({success:true})

//       const product = await Product.findById(productId);
//       if (product.category_discount > 0) {
//         product.discount = 0;
//         const originalPrice = product.product_price;
//         const discountedAmount = calculateDiscountedPrice(originalPrice, product.category_discount);
//         product.discountedAmount=discountedAmount
//         await product.save();
//       }
//       product.discount = 0;
//       product.discountedAmount=0
//       await product.save();


//   } catch (error) {
//       console.log(error);
//   }
// }

const removeOffer = async (req, res) => {
  try {
    const productId = req.body.productId;

    const product = await Product.findById(productId);
    
    if (product.category_discount > 0) {
      // Retain the existing product offer
      product.discount = 0;
      const originalPrice = product.product_price;
      const discountedAmount = calculateDiscountedPrice(originalPrice, product.category_discount);
      product.discountedAmount = discountedAmount;
    } else {
      // Reset the product's discount and discounted amount to 0
      product.discount = 0;
      product.discountedAmount = 0;
    }

    await product.save();
    
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};




const loadCategoryOffers=async (req,res)=>{
  try {
      // const nonOffer=await Product.find({blocked:false})
      const offer=await Category.find({discount:{$gt:0}})
      // console.log('offffff',offer);
      // res.render('offerproduct',{nonOffer:nonOffer,offer:offer})
      res.render('offercategory',{offer})
  } catch (error) {
      console.log(error);
  }
}
const loadaddCategoryOffers=async (req,res)=>{
  try {
    const categories = await Category.find({});
    console.log("prodsdf",categories)
      res.render('addcategoryoffer',{categories})
  } catch (error) {
      console.log(error);
  }
}


// const addCategoryOffers = async (req, res) => {
//   try {
//     const categoryId = req.body.categoryId;
//     const discount = req.body.discount;

//     const category = await Category.findById(categoryId);

//     // Check if the category exists
//     if (!category) {
//       return res.status(404).send("Category not found");
//     }

//     // Update category discount
//     category.discount = discount;
//     await category.save();

//     // Find all products in the category and update their discounts
//     const products = await Product.find({ category: category.category_name });
//     products.forEach(async (product) => {
//       const originalPrice = product.product_price;
//       const discountedAmount = calculateDiscountedPrice(originalPrice, discount);

//       // Check if the new discount is greater than the existing one
//       if (discount > product.discount) {
//         product.discountedAmount = discountedAmount;
//         product.discount = discount;
//         await product.save();
//       }
//     });

//     res.redirect('/admin/category-offer');
//   } catch (error) {
//     console.log(error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// const addCategoryOffers = async (req, res) => {
//   try {
//     const categoryId = req.body.categoryId;
//     const discount = req.body.discount;
    

//     const category = await Category.findById(categoryId);

//     // Check if the category exists
//     if (!category) {
//       return res.status(404).send("Category not found");
//     }

//     // Update category discount
//     category.discount = discount;
//     await category.save();

//     // Find all products in the category and update their discounts
//     const products = await Product.find({ category: category.category_name });
//     products.forEach(async (product) => {
//       product.category_discount = category.discount;
//       const originalPrice = product.product_price;

//       const productDiscount = Math.max(discount, product.discount)
//       const discountedAmount = calculateDiscountedPrice(originalPrice, productDiscount);

//       product.discountedAmount = discountedAmount;
      
//       // Update category_discount in the product
//       await product.save();
//     });

//     res.redirect('/admin/category-offer');
//   } catch (error) {
//     console.log(error);
//     res.status(500).send("Internal Server Error");
//   }
// };


const addCategoryOffers = async (req, res) => {
  try {
    const categoryId = req.body.categoryId;
    const discount = req.body.discount;

    const category = await Category.findById(categoryId);

    // Check if the category exists
    if (!category) {
      return res.status(404).send("Category not found");
    }

    // Update category discount
    category.discount = discount;
    await category.save();

    // Find all products in the category and update their discounts
    const products = await Product.find({ category: category.category_name });
    
    for (const product of products) {
      const originalPrice = product.product_price;

      // Calculate product discount based on category discount if it's greater
      const productDiscount = Math.max(discount, product.discount);

      const discountedAmount = calculateDiscountedPrice(originalPrice, productDiscount);

      product.discountedAmount = discountedAmount;
      product.category_discount = category.discount;
      
      // Update category_discount in the product
      await product.save();
    }

    res.redirect('/admin/category-offer');
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


// const removecategoryOffer=async (req,res)=>{

//   try {
//     console.log(req.body.categoryId)
//       console.log('jkncjkjwcnj');
//       const categoryId=req.body.categoryId
//       const category=await Category.findByIdAndUpdate({_id:categoryId},
//           {
//               $set:{discount:0}
//           })
//           res.json({success:true})

//   } catch (error) {
//       console.log(error);
//   }
// }

// const removecategoryOffer = async (req, res) => {
//   try {
//     const categoryId = req.body.categoryId;

//     // Find the category by ID
//     const category = await Category.findById(categoryId);

//     // Check if the category exists
//     if (!category) {
//       return res.status(404).json({ success: false, error: "Category not found" });
//     }

//     // Update category discount to 0
//     category.discount = 0;
//     await category.save();

//     // Find all products in the category
//     const products = await Product.find({ category: category.category_name });

//     // Iterate through each product
//     for (const product of products) {
//       // Check if the product has an existing product offer
//       if (product.discount > 0) {
//         product.category_discount = 0;
//         const originalPrice = product.product_price;
//         const discountedAmount = calculateDiscountedPrice(originalPrice, product.discount);
//         product.discountedAmount=discountedAmount
//         await product.save();
//       }

//       // Reset the product's discount and discounted amount to 0
//       product.discountedAmount = 0;
//       product.category_discount = 0;
//       await product.save();
//     }

//     res.json({ success: true });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// };

const removecategoryOffer = async (req, res) => {
  try {
    const categoryId = req.body.categoryId;

    // Find the category by ID
    const category = await Category.findById(categoryId);

    // Check if the category exists
    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    // Update category discount to 0
    category.discount = 0;
    await category.save();

    // Find all products in the category
    const products = await Product.find({ category: category.category_name });

    // Iterate through each product
    for (const product of products) {
      // Check if the product has an existing product offer
      if (product.discount > 0) {
        // Retain the existing product offer
        const originalPrice = product.product_price;
        const discountedAmount = calculateDiscountedPrice(originalPrice, product.discount);
        product.discountedAmount = discountedAmount;
        product.category_discount = 0; // Reset category_discount
        await product.save();
      } else {
        // Reset the product's discount and discounted amount to 0
        product.discountedAmount = 0;
        product.category_discount = 0;
        await product.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};



// const removecategoryOffer = async (req, res) => {
//   try {
//     const categoryId = req.body.categoryId;

//     // Find the category by ID
//     const category = await Category.findById(categoryId);

//     // Check if the category exists
//     if (!category) {
//       return res.status(404).json({ success: false, error: "Category not found" });
//     }

//     // Update category discount to 0
//     category.discount = 0;
//     await category.save();

//     // Find all products in the category
//     const products = await Product.find({ category: category.category_name });

//     // Iterate through each product
//     for (const product of products) {
//       // Reset the product's discount and discounted amount to 0
//       product.discountedAmount = 0;
//       product.category_discount = 0;
//       await product.save();
//     }

//     res.json({ success: true });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// };


const bannerLoad = async (req, res) => {
  try {
    const banners = await Banner.find({});
    res.render('banners', { banners})
  } catch (error) {
    console.log(error);
  }
};


const addbannerLoad = async(req,res)=>{
  try{
      res.render('addbanner')
  }catch(error){
      console.log(error.message)
  }
}

const addBanner = async (req, res) => {
  try {
    let details = req.body;

    // Read the cropped image and convert it to file format (JPEG)
    const croppedImageBuffer = Buffer.from(
      details.croppedImageData1.replace(/^data:image\/jpeg;base64,/, ""),
      "base64"
    );

    // Assuming your Banner model has a field for the image
    const banner = new Banner({
      mainHead: details.mainHead,
      typeHead:details.typeHead,
      description: details.description,
      bannerURL: details.url,
      status: true,
      image: "banner_image_" + Date.now() + ".jpg", // Save the filename or path to the image
    });

    // Save the image file to the server (assuming 'public/banners/images' is the destination)
    fs.writeFileSync(
      path.join(
        __dirname,
        "../public/banners/images",
        banner.image
      ),
      croppedImageBuffer
    );

    // Save the banner details to the database
    const result = await banner.save();
    console.log(result);

    // Redirect to the banners page after successful submission
    res.redirect("/admin/banner");
  } catch (error) {
    console.log(error);
    // Handle errors, perhaps by sending an error response
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const deleteBanner = async (req, res) => {
  try {
    console.log("enterer")
    const bannerId = req.params.id;

    // Find the banner by ID and remove it
    const deletedBanner = await Banner.findByIdAndRemove(bannerId);

    if (!deletedBanner) {
      // Banner not found
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Respond with a JSON object indicating success
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// const salesreportLoad = async (req, res) => {
//   try {
    
//     res.render('salesreport', { })
//   } catch (error) {
//     console.log(error);
//   }
// };
// const salesreportLoad = async (req, res, next) => {
//   try {
//     const totalAmount = await Order.aggregate([
//       { $unwind: '$cart.products' },
//       { $match: { 'cart.products.orderStatus': 'Delivered' } },
//       { $group: { _id: null, total: { $sum: '$cart.products.price' } } }
//     ]);

//     const totalSold = await Order.aggregate([
//       { $unwind: '$cart.products' },
//       { $match: { 'cart.products.orderStatus': 'Delivered' } },
//       { $group: { _id: null, total: { $sum: '$cart.products.quantity' } } }
//     ]);

//     const products = await Order.find({ 'cart.products.orderStatus': 'Delivered' })
//       .populate('cart.products.productId')
//       .populate('user');

//     console.log(totalAmount, totalSold, products);

//     res.render('salesreport', {
//       totalAmount,
//       totalSold,
//       products,
//     });

//   } catch (err) {
//     console.log(err.message);
//     // Handle error appropriately
//     next(err);
//   }
// };

// const salesreportLoad = async (req, res, next) => {
//   try {
//     const orders = await Order.find({
//       $or: [
//         { 'paymentOption': 'COD', 'cart.products.orderStatus': 'Delivered', 'status': true },
//         { 'paymentOption': { $in: ['Wallet', 'Razorpay'] }, 'status': true },
//       ],
//     })
//       .populate('cart.products.productId')
//       .populate('user');

//     res.render('salesreport', { 
//       orders,
//     });

//   } catch (err) {
//     console.log(err.message);
//     // Handle error appropriately
//     next(err);
//   }
// };


const salesreportLoad = async (req, res, next) => {
  try {
    const salesData = await Order.aggregate([
      {
        $match: {
          $or: [
            { 'paymentOption': 'COD', 'cart.products.orderStatus': 'Delivered', 'status': true },
            { 'paymentOption': { $in: ['Wallet', 'Razorpay'] }, 'status': true },
          ],
        },
      },
      {
        $unwind: "$cart.products",
      },
      {
        $lookup: {
          from: 'products', // Assuming your products collection is named 'products'
          localField: 'cart.products.productId',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $lookup: {
          from: 'users', // Assuming your users collection is named 'users'
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $project: {
          _id: 1,
          orderDate: 1,
          totalAmount: 1,
          paymentOption: 1,
          'cart.products.productId': 1,
          'cart.products.orderStatus': 1,
          'cart.products.quantity': 1,
          'cart.products.price': 1, // Include price in the projection
          'productDetails.product_name': 1,
          'productDetails.category': 1,
          'productDetails.product_price': 1,
          'userData.username': 1,
        },
      },
    ]);
    
   
    

    if (req.query.export === 'csv') {
      console.log("ahfsdff")
      const excelData = salesData.map(order => ({
        'Order ID': order._id,
        'Username': order.userData[0]?.username || '',
        'Product': order.productDetails[0]?.product_name || '',
        'Category': order.productDetails[0]?.category || '',
        'Price': `₹${order.cart.products.price.toFixed(2) || ''}`,
        'Quantity': order.cart.products.quantity || '',
        'Order Date': order.orderDate.toDateString(),
        'Time': order.orderDate.toLocaleTimeString(),
        'Payment Method': order.paymentOption || '',
        'Order Status': order.cart.products.orderStatus || '',
        'Return Status': order.cart.products[0]?.returnOrder?.returnStatus || '',
      }));

      const json2csvParser = new Parser();
      const excel = json2csvParser.parse(excelData);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
      res.status(200).send(excel);
    }  else {
      res.render('salesreport', { salesData });
    }

  } catch (err) {
    console.log(err.message);
    // Handle error appropriately
    next(err);
  }
};


// const exportReport = async (req, res) => {
//   try {
//     const orders = await Order.find().sort({ createdAt: -1 });
//     console.log(orders);

//     // Transform the data to the format needed for CSV
//     const csvData = orders.map(order => {
//       const orderDate = order.createdAt ? order.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).replace(/\//g, '-') : '';
//       const productStatus = order.products && order.products.length > 0 && order.products[0].status ? order.products[0].status : '';
//       console.log(orderDate);
//       console.log(productStatus);

//       return {
//         'Order Id': order._id,
//         'Order Date': orderDate,
//         'Amount': order.totalAmount,
//         'Payment': order.paymentMethod,
//         'Payment Status': order.paymentStatus,
//         'Status': productStatus,
//       };
//     });

//     const json2csvParser = new Parser();
//     const csv = json2csvParser.parse(csvData);

//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
//     res.status(200).send(csv);
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send('Internal Server Error');
//   }
// };




// const sortSalesReport = async (req, res, next) => {
//   try {
//     let fromDate = req.body.startDate ? new Date(req.body.startDate) : null;
//     fromDate.setHours(0, 0, 0, 0);
//     let toDate = req.body.endDate ? new Date(req.body.endDate) : null;
//     toDate.setHours(23, 59, 59, 999);

//     const currentDate = new Date();

//     if (fromDate && toDate) {
//       if (toDate < fromDate) {
//         const temp = fromDate;
//         fromDate = toDate;
//         toDate = temp;
//       }
//     } else if (fromDate) {
//       toDate = currentDate;
//     } else if (toDate) {
//       fromDate = currentDate;
//     }

//     const orders = await Order.find({
//       $or: [
//         { 'paymentOption': 'COD', 'cart.products.orderStatus': 'Delivered', 'status': true },
//         { 'paymentOption': { $in: ['Wallet', 'Razorpay'] }, 'status': true },
//       ],
//       orderDate: { $gte: fromDate, $lte: toDate },
//     })
//     .populate('cart.products.productId')
//     .populate('user');

//     res.render('salesreport', {
//       orders,
//     });
//   } catch (err) {
//     console.log(err.message);
//     // Handle error appropriately
//     next(err);
//   }
// };

const sortSalesReport = async (req, res, next) => {
  try {
    let fromDate = req.body.startDate ? new Date(req.body.startDate) : null;
    fromDate.setHours(0, 0, 0, 0);
    let toDate = req.body.endDate ? new Date(req.body.endDate) : null;
    toDate.setHours(23, 59, 59, 999);

    const currentDate = new Date();

    if (fromDate && toDate) {
      if (toDate < fromDate) {
        const temp = fromDate;
        fromDate = toDate;
        toDate = temp;
      }
    } else if (fromDate) {
      toDate = currentDate;
    } else if (toDate) {
      fromDate = currentDate;
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          $or: [
            { 'paymentOption': 'COD', 'cart.products.orderStatus': 'Delivered', 'status': true },
            { 'paymentOption': { $in: ['Wallet', 'Razorpay'] }, 'status': true },
          ],
          orderDate: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $unwind: "$cart.products",
      },
      {
        $lookup: {
          from: 'products',
          localField: 'cart.products.productId',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $project: {
          _id: 1,
          orderDate: 1,
          totalAmount: 1,
          paymentOption: 1,
          'cart.products.productId': 1,
          'cart.products.orderStatus': 1,
          'cart.products.quantity': 1,
          'cart.products.price': 1,
          'productDetails.product_name': 1,
          'productDetails.category': 1,
          'productDetails.product_price': 1,
          'userData.username': 1,
        },
      },
    ]);

    res.render('salesreport', { salesData });

  } catch (err) {
    console.log(err.message);
    // Handle error appropriately
    next(err);
  }
};




module.exports={
    loginLoad,
    adminLogout,
    loaddashboard,
    usersLoad,
    categoryLoad,
    addcategoryLoad,
    addCategory,
    editCategoryLoad,
    updateCategoryData,
    unlistCategory,
    blockOrNot,
    editproductLoad,
    updateproducts,
    verifyLogin,
    orderLoad,
    orderDetails,
    updateOrderStatus,
    updateReturnStatus,
    couponLoad,
    couponAdd,
    couponSet,
    deleteCoupon,
    loadCouponEdit,
    editCoupon,
    offerLoad,

    loadProductOffers,
    loadaddProductOffers,
    addProductOffers,
    removeOffer,

    loadCategoryOffers,
    loadaddCategoryOffers,
    addCategoryOffers,
    removecategoryOffer,

    bannerLoad,
    addbannerLoad,
    addBanner,
    deleteBanner,

    salesreportLoad,
    sortSalesReport,
    // exportReport

   
   
}