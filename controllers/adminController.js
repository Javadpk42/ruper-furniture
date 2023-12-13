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
  }
};

const loginLoad=async(req,res,next)=>{
    try {
        res.render('login')
    } catch (error) {
      next(error);

    }
}
const adminLogout=async(req,res,next)=>{
  try {
      req.session.destroy()
      res.redirect('/admin')
  } catch (error) {
    next(error);
  }
}
const verifyLogin=async(req,res,next)=>{
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
    next(error);

  }
}


const usersLoad = async (req, res,next) => {
  try {
    const { search } = req.query;

    const page = req.query.page || 1;
    const limit = 5;

    const skip = (page - 1) * limit;

    let users;

    if (search) {
      users = await userModel
        .find({ username: { $regex: '.*' + search + '.*', $options: 'i' } })
        .skip(skip)
        .limit(limit);
    } else {
      users = await userModel.find().skip(skip).limit(limit);
    }

    const totalCount = await userModel.countDocuments();

    res.render('customers', {
      userss: users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      search: search, 
    });
  } catch (error) {
    next(error);

  }
};



const blockOrNot = async (req, res,next) => {
  try {
    const id = req.body.id;
    const userData = await userModel.findOne({ _id: id });

    if (req.session && req.session.user_id && req.session.user_id.toString() === id.toString()) {
      req.session.destroy((err) => {
        if (err) {
        }
      });
    } 

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
    next(error);
  }
};
  

  

  
  const categoryLoad = async (req, res,next) => {
    try {
      const search = req.query.search || ''; 
      const page = parseInt(req.query.page) || 1;
      const limit = 5; 
  
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
      }); 
    } catch (error) {
      next(error);
    }
  };
  

  const unlistCategory = async (req, res,next) => {
    try {
      const id = req.body.id;
      const category = await Category.findById(id);
  
      if (category) {
        category.is_listed = !category.is_listed;
        await category.save();
      }
  
      const categories = await Category.find({});
      res.redirect("/admin/categories");
    } catch (error) {
      next(error);
    }
  };
  


  const addcategoryLoad = async (req, res,next) => {
    try {
      res.render("addcategories");
    } catch (error) {
      next(error);

    }
  };


 

const addCategory = async (req, res,next) => {
  try {

      const categoryName = req.body.category_name.toLowerCase();

      const existingCategory = await Category.findOne({
          category_name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
      });

      if (existingCategory) {
          return res.render('addcategories', { message: "Category Already Created" });
      }

      let category = await new Category({
          category_name: req.body.category_name, 
          category_description: req.body.category_description,
          is_listed: true,
      });

      let result = await category.save();
      res.redirect("/admin/categories");
  } catch (error) {
    next(error);
  }  
};


const editCategoryLoad = async (req, res,next) => {
  try {
    const categoryId = req.query.id;
    const categoryDetails = await Category.find({ _id: categoryId });
    res.render("editCategories", { categories: categoryDetails });
  } catch (error) {
    next(error);

  }
};


const   updateCategoryData = async (req, res,next) => {
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
    res.redirect("/admin/categories");
  } catch (error) {
    next(error);

  }
}; 












const editproductLoad=async(req,res,next)=>{
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
    next(error);

  }
}
const updateproducts=async(req,res,next)=>{
  try{
     const productData=await productModel.findByIdAndUpdate({_id:req.body.id},{$set:{name:req.body.name}})
      res.redirect('/admin/products')
  }
  catch(error){
    next(error);

  }
}




const orderLoad = async (req, res,next) => {
  try {
    const orders = await Order.find({})
      .sort({ orderDate: -1 })
      .populate({
        path: 'user',
        model: 'User',
        select: 'username' 
      });

    if (orders) {
      res.render('orders', { orders });
    } else {
      res.render('orders', { orders: [] });
    }
  } catch (error) {
    next(error);
  }
};


const orderDetails = async (req, res,next) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId).populate({
      path: 'cart.products.productId',
      model: 'product',
    });

    if (!order) {
      return res.status(404).render('error', { message: 'Order not found' });
    }
 

    const { cart, deliveryAddress, paymentOption, totalAmount, orderDate} = order;

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
    next(error);
  }
};





const updateOrderStatus = async (req, res,next) => {
  try {
    const productId = req.params.orderId;
    const newStatus = req.body.status;
   

    const order = await Order.findOne({ 'cart.products._id': new mongoose.Types.ObjectId(productId) });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const product = order.cart.products.find(product => product._id.toString() === productId);
    if (product) {
      product.orderStatus = newStatus;

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
        //
        case 'Cancelled':
          const refundedProduct = product;
    
          const user = await userModel.findById(order.user);
          const refundAmount = refundedProduct.price*product.quantity;
          user.wallet += refundAmount;

          const canceledProduct = await Product.findById(refundedProduct.productId);
          canceledProduct.stock += refundedProduct.quantity;
          await canceledProduct.save();
    
          user.walletHistory.push({
            date: new Date(),
            amount: refundAmount,
            description: `Refund from order cancel ${order._id}`,
            transactionType: 'credit',
          });
    
          await user.save();
          break;

        default:
          break;
      }

      await order.save();
    } 
    else {
      return res.status(404).json({
        success: false,
        message: 'Product not found in order',
      });
    }

    res.redirect('/admin/orders');
  } catch (error) {
    next(error);
  }
};



const updateReturnStatus = async (req, res,next) => {
  try {
    
    const productId = req.params.orderId;
    const newStatus = req.body.returnstatus;

    const order = await Order.findOne({ 'cart.products._id': new mongoose.Types.ObjectId(productId) });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const product = order.cart.products.find(product => product._id.toString() === productId);
    if (product) {
      product.returnOrder.returnStatus = newStatus;

      switch (newStatus) {
        case 'Out for pickup':
          product.returnOrder.statusLevel = 2;
          break;
        case 'Returned':
          product.returnOrder.statusLevel = 3;
          const returnedProduct = await Product.findById(product.productId);
          returnedProduct.stock += product.quantity;
          await returnedProduct.save();
          break;
        case 'Refund':
          product.returnOrder.statusLevel = 4;

          const refundedProduct= product

          const user = await userModel.findById(order.user);
          const refundAmount = refundedProduct.price*product.quantity;
          user.wallet += refundAmount;
          await user.save();

          user.walletHistory.push({
            date: new Date(),
            amount: refundAmount,
            description: `Refund from order return ${order._id}`,
            transactionType: 'credit',
          });

          await user.save();

          break;

        default:
          break;
      }

      await order.save();
    } else {
      return res.status(404).json({
        success: false,
        message: 'Product not found in order',
      });
    }

    res.redirect('/admin/orders');
  } catch (error) {
    next(error);
  }
};


const couponLoad = async (req, res,next) => {
  try {
    const couponData = await Coupon.find()
    res.render('coupon', { couponData })
  } catch (error) {
    next(error);

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




const loaddashboard = async (req, res, next) => {
  try {
 

    const totalUsers = await userModel.countDocuments();
    const totalOrders=await Order.countDocuments()
  
    const paymentMethodsData = await Order.aggregate([
      {
        $group: {
          _id: "$paymentOption",
          count: { $sum: 1 },
        },
      },
    ]);
    
    
    const paymentMethodsLabels = paymentMethodsData.map(method => method._id);
    const paymentMethodsCount = paymentMethodsData.map(method => method.count);
    


    const allOrdersRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);


    const totalAllOrdersRevenue = allOrdersRevenue.length > 0 ? allOrdersRevenue[0].totalAmount : 0;
    const averageOrderValue =totalAllOrdersRevenue > 0 ? totalAllOrdersRevenue / totalOrders : 0;
const revenueOrders = await Order.aggregate([
  {
    $unwind: "$cart.products",
  },
  {
    $match: {
      $or: [
        {
          paymentOption: 'COD',
          'cart.products.orderStatus': 'Delivered',
        },
        {
          paymentOption: { $in: ['Razorpay', 'Wallet'] },
          'cart.products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] },
        },
      ],
      'cart.products.returnOrder.returnStatus': { $ne: 'Refund' },
    },
   
  },
  {
    $group: {
      _id: null,
      totalAmount: { $sum: { $multiply: ['$cart.products.price', '$cart.products.quantity'] } },
    },
  },
]);

const totalRevenue = revenueOrders.length > 0 ? revenueOrders[0].totalAmount : 0;


 


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
      'cart.products.returnOrder.returnStatus': { $ne: 'Refund' },
    },
  },
  {
    $group: {
      _id: '$cart.products.productId',
      totalAmount: { $sum: { $multiply: ['$cart.products.price', '$cart.products.quantity'] } },
    },
  },
]);



const productIds = revenuePerProduct.map(product => product._id);


const allProducts = await Product.find({}, 'product_name');


const productMap = new Map(allProducts.map(product => [product._id.toString(), product]));

const productData = allProducts.map(product => {
  const revenueProduct = revenuePerProduct.find(rp => rp._id.toString() === product._id.toString());
  return {
    name: product.product_name,
    revenue: revenueProduct ? revenueProduct.totalAmount : 0,
  };
});

const sortedProducts = productData.sort((a, b) => b.revenue - a.revenue);

const top3Products = sortedProducts.slice(0, 3);


const productLabels = top3Products.map(product => product.name);
const productRevenues = top3Products.map(product => product.revenue);





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
      'cart.products.returnOrder.returnStatus': { $ne: 'Refund' },
    },
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
    $unwind: "$productDetails",
  },
  {
    $group: {
      _id: '$productDetails.category',
      totalAmount: { $sum: { $multiply: ['$cart.products.price', '$cart.products.quantity'] } },
    },
  },
]);



const allCategories = await Category.find({}, 'category_name');


const categoryData = allCategories.map(category => ({
  name: category.category_name,
  revenue: revenuePerCategory.find(c => c._id === category.category_name)?.totalAmount || 0,
}));

const sortedCategories = categoryData.sort((a, b) => b.revenue - a.revenue);

const allCategoryLabels = allCategories.map(category => category.category_name);


const top4Categories = sortedCategories.slice(0, 4);


const categoryLabels = top4Categories.map(category => category.name);
const categoryRevenues = top4Categories.map(category => category.revenue);



const today = new Date();
const lastWeekStartDate = new Date(today);
lastWeekStartDate.setDate(today.getDate() - 7);

const ordersInDateRange = await Order.find({
  orderDate: { $gte: lastWeekStartDate, $lte: today },
});


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

const allDaysOfLastWeek = [];
let currentDate = new Date(lastWeekStartDate);
while (currentDate <= today) {
  allDaysOfLastWeek.push(currentDate.toISOString().split('T')[0]);
  currentDate.setDate(currentDate.getDate() + 1);
}

const formattedWeeklyRevenueChartData = allDaysOfLastWeek.map(day => {
  const matchingEntry = weeklyrevenueOrders.find(entry => entry._id === day);
  return {
    date: day,
    amount: matchingEntry ? matchingEntry.totalAmount : 0,
  };
});

const weeklyRevenueLabels = formattedWeeklyRevenueChartData.map(entry => entry.date);
const weeklyRevenueData = formattedWeeklyRevenueChartData.map(entry => entry.amount);

console.log(weeklyRevenueData);
console.log(weeklyRevenueLabels);







const monthlyRevenueOrders = await Order.aggregate([
  {
    $match: {
      orderDate: { $lte: today },
      $or: [
        { paymentOption: 'COD', 'cart.products.orderStatus': 'Delivered' },
        {
          paymentOption: { $in: ['Razorpay', 'Wallet'] },
          'cart.products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] },
        },
      ],
    },
  },
  {
    $unwind: "$cart.products",
  },
  {
    $match: {
      'cart.products.returnOrder.returnStatus': { $ne: 'Refund' },
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$orderDate" } },
      totalAmount: {
        $sum: {
          $cond: {
            if: { $eq: ['$cart.products.returnOrder.returnStatus', 'Refund'] },
            then: 0, // Exclude refund products
            else: { $multiply: ['$cart.products.price', '$cart.products.quantity'] },
          },
        },
      },
    },
  },
  {
    $sort: {
      _id: 1,
    },
  },
]);




const allMonths = [];
let currentMonthDate = new Date(today.getFullYear(), 0, 1); 
while (currentMonthDate <= today) {
  allMonths.push(currentMonthDate.toISOString().split('T')[0].substring(0, 7)); 
  currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
}

const formattedMonthlyRevenueChartData = allMonths.map(month => {
  const matchingMonthEntry = monthlyRevenueOrders.find(entry => entry._id === month);
  return {
    month: month,
    amount: matchingMonthEntry ? matchingMonthEntry.totalAmount : 0,
  };
});

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

const monthlyRevenueLabels = formattedMonthlyRevenueChartData.map(entry => entry.month);
const monthlyRevenueData = formattedMonthlyRevenueChartData.map(entry => entry.amount);




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
    $unwind: "$cart.products",
  },
  {
    $match: {
      'cart.products.returnOrder.returnStatus': { $ne: 'Refund' },
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y", date: "$orderDate" } },
      totalAmount: {
        $sum: {
          $cond: {
            if: { $eq: ['$cart.products.returnOrder.returnStatus', 'Refund'] },
            then: 0, // Exclude refund products
            else: { $multiply: ['$cart.products.price', '$cart.products.quantity'] },
          },
        },
      },
    },
  },
  {
    $sort: {
      _id: 1,
    },
  },
]);




const allYearsFiveYears = [];
let currentYearDateFiveYears = new Date(today.getFullYear() - 5, 0, 1);
while (currentYearDateFiveYears.getFullYear() <= today.getFullYear()) {
  allYearsFiveYears.push(currentYearDateFiveYears.toISOString().split('T')[0].substring(0, 4)); // Format as "YYYY"
  currentYearDateFiveYears.setFullYear(currentYearDateFiveYears.getFullYear() + 1);
}

const formattedFiveYearsRevenueChartData = allYearsFiveYears.map(year => {
  const matchingYearEntry = fiveYearsRevenueOrders.find(entry => entry._id === year);
  return {
    year: year,
    amount: matchingYearEntry ? matchingYearEntry.totalAmount : 0,
  };
});

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
  yearlyRevenueLabels,
  
});

  } catch (err) {
    next(err);
  }
};





const offerLoad = async (req, res,next) => {
  try {
    
    res.render('offer', { })
  } catch (error) {
    next(error);

  }
};

const loadProductOffers=async (req,res,next)=>{
  try {
      const offer=await Product.find({discount:{$gt:0}})
      res.render('offerproduct',{offer})
  } catch (error) {
    next(error);

  }
}
const loadaddProductOffers=async (req,res,next)=>{
  try {
    const products = await Product.find({});
      res.render('addproductoffer',{products})
  } catch (error) {
    next(error);

  }
}
function calculateDiscountedPrice(originalPrice, discountPercentage) {
  const discountAmount = (discountPercentage / 100) * originalPrice;
  return originalPrice - discountAmount;
}



const addProductOffers = async (req, res,next) => {
  try {
    const productId = req.body.productId;
    const discount = req.body.discount;

    const product = await Product.findById(productId);
    const originalPrice = product.product_price;
    const discountedAmount = calculateDiscountedPrice(originalPrice, discount);

    if (discountedAmount < product.discountedAmount || product.discountedAmount==0) {
      product.discountedAmount = discountedAmount;
    }
      product.discount = discount;
      await product.save();
    

    res.redirect('/admin/product-offer');
  } catch (error) {
    next(error);
  }
};



const removeOffer = async (req, res,next) => {
  try {
    const productId = req.body.productId;

    const product = await Product.findById(productId);
    
    if (product.category_discount > 0) {
      product.discount = 0;
      const originalPrice = product.product_price;
      const discountedAmount = calculateDiscountedPrice(originalPrice, product.category_discount);
      product.discountedAmount = discountedAmount;
    } else {
      product.discount = 0;
      product.discountedAmount = 0;
    }

    await product.save();
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};




const loadCategoryOffers=async (req,res,next)=>{
  try {
      const offer=await Category.find({discount:{$gt:0}})
      res.render('offercategory',{offer})
  } catch (error) {
    next(error);

  }
}
const loadaddCategoryOffers=async (req,res,next)=>{
  try {
    const categories = await Category.find({});
      res.render('addcategoryoffer',{categories})
  } catch (error) {
    next(error);

  }
}





const addCategoryOffers = async (req, res,next) => {
  try {
    const categoryId = req.body.categoryId;
    const discount = req.body.discount;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    category.discount = discount;
    await category.save();

    const products = await Product.find({ category: category.category_name });
    
    for (const product of products) {
      const originalPrice = product.product_price;

      const productDiscount = Math.max(discount, product.discount);

      const discountedAmount = calculateDiscountedPrice(originalPrice, productDiscount);

      product.discountedAmount = discountedAmount;
      product.category_discount = category.discount;
      
      await product.save();
    }

    res.redirect('/admin/category-offer');
  } catch (error) {
    next(error);
  }
};




const removecategoryOffer = async (req, res,next) => {
  try {
    const categoryId = req.body.categoryId;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    category.discount = 0;
    await category.save();

    const products = await Product.find({ category: category.category_name });

    for (const product of products) {
      if (product.discount > 0) {
        const originalPrice = product.product_price;
        const discountedAmount = calculateDiscountedPrice(originalPrice, product.discount);
        product.discountedAmount = discountedAmount;
        product.category_discount = 0; 
        await product.save();
      } else {
        product.discountedAmount = 0;
        product.category_discount = 0;
        await product.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};






const bannerLoad = async (req, res,next) => {
  try {
    const banners = await Banner.find({});
    res.render('banners', { banners})
  } catch (error) {
    next(error);

  }
};


const addbannerLoad = async(req,res,next)=>{
  try{
      res.render('addbanner')
  }catch(error){
    next(error);

  }
}

const addBanner = async (req, res,next) => {
  try {
    let details = req.body;

    const croppedImageBuffer = Buffer.from(
      details.croppedImageData1.replace(/^data:image\/jpeg;base64,/, ""),
      "base64"
    );

    const banner = new Banner({
      mainHead: details.mainHead,
      typeHead:details.typeHead,
      description: details.description,
      bannerURL: details.url,
      status: true,
      image: "banner_image_" + Date.now() + ".jpg", 
    });

    fs.writeFileSync(
      path.join(
        __dirname,
        "../public/banners/images",
        banner.image
      ),
      croppedImageBuffer
    );

    const result = await banner.save();

    res.redirect("/admin/banner");
  } catch (error) {
    next(error);
  }
};


const deleteBanner = async (req, res,next) => {
  try {
    const bannerId = req.params.id;

    const deletedBanner = await Banner.findByIdAndRemove(bannerId);

    if (!deletedBanner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};




const salesreportLoad = async (req, res, next) => {
  try {

    const formatTime = (date) => {
      const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
      return new Intl.DateTimeFormat('en-US', options).format(date);
    };

    const salesData = await Order.aggregate([

      {
        $match: {
          $or: [
            {
              paymentOption: 'COD',
              'cart.products.orderStatus': 'Delivered',
              'cart.products.returnOrder.returnStatus': { $ne: 'Refund' },
            },
            {
              paymentOption: { $in: ['Razorpay', 'Wallet'] },
              'cart.products.orderStatus': { $in: ['Placed', 'Shipped', 'Out for delivery', 'Delivered'] },
              'cart.products.returnOrder.returnStatus': { $ne: 'Refund' },
            },
          ],
          'cart.products.returnOrder.returnStatus': { $ne: 'Refund' },
        },
      },
      {
        $unwind: "$cart.products",
      },
      {
        $match: {
          'cart.products.returnOrder.returnStatus': { $ne: 'Refund' },
        },
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
    
    console.log("Sales Data:", salesData);
    
    
  
    
    
    
    

    if (req.query.export === 'csv') {
      const excelData = salesData.map(order => ({
        'Order ID': order._id,
        'Username': order.userData[0]?.username || '',
        'Product': order.productDetails[0]?.product_name || '',
        'Category': order.productDetails[0]?.category || '',
        'Price': order.cart.products.price.toFixed(2) || '', 
        'Quantity': order.cart.products.quantity || '',
        'Order Date': order.orderDate.toDateString(),
        'Time': formatTime(new Date(order.orderDate)),
        'Payment Method': order.paymentOption || '',
        'Order Status': order.cart.products.orderStatus || '',
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
    next(err);
  }
};




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
    next(err);
  }
};




module.exports={
    loginLoad,
    verifyLogin,
    adminLogout,

    loaddashboard,

    salesreportLoad,
    sortSalesReport,

    usersLoad,
    blockOrNot,


    categoryLoad,
    addcategoryLoad,
    addCategory,
    editCategoryLoad,
    updateCategoryData,
    unlistCategory,

    editproductLoad,
    updateproducts,

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
   
}