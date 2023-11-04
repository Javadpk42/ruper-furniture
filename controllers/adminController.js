const userModel = require("../model/userModel")
const adminModel = require("../model/userModel")

const Category = require("../model/productModel").category;
const { category } = require("../model/productModel");

const Order = require("../model/orderModel")

const bcrypt=require('bcrypt');
const { name } = require('ejs');
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

      const userData=await adminModel.findOne({email:email})
      if(userData){
          const passwordMatch=await bcrypt.compare(password,userData.password)
          if (passwordMatch) {
              if (userData.is_admin===0) {
                  res.render('login',{message:"Email and password is incorrect"})
              } else {
                  req.session.admin_id=userData._id
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
const loaddashboard=async(req,res)=>{
    try {
        res.render('dashboard')
    } catch (error) {
        console.log(error.message )
    }
}

// const usersLoad = async (req,res)=>{
//     try {
//       let users= await getAllUserData() 
//       res.render('customers',{userss:users})
//     } catch (error) {
//       console.log(error);
//     }
//   }
// const usersLoad = async (req, res) => {
//   try {
//     const { search } = req.query;
//     let users;

//     if (search) {
//       users = await userModel.find({
//         username: { $regex: '.*' + search + '.*', $options: 'i' },
//       });
//     } else {
//       users = await getAllUserData();
//     }

//     res.render('customers', { userss: users });
//   } catch (error) {
//     console.log(error);
//   }
// };


// const usersLoad = async (req, res) => {
//   try {
//     const { search } = req.query;
//     let users;

//     // Pagination settings
//     const page = req.query.page || 1;
//     const limit = 5;

//     // Calculate skip value based on page and limit
//     const skip = (page - 1) * limit;

//     if (search) {
//       // Fetch users with search and pagination
//       users = await userModel
//         .find({ username: { $regex: '.*' + search + '.*', $options: 'i' } })
//         .skip(skip)
//         .limit(limit);
//     } else {
//       // Fetch all users with pagination
//       users = await userModel.find().skip(skip).limit(limit);
//     }

//     res.render('customers', {
//       userss: users,
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(users.length / limit),
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

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



  
  const getAllUserData = async (req,res)=>{
    return new Promise(async(resolve,reject)=>{
      let userData = await userModel.find({})
      resolve(userData)
    })
  }

  // const categoryLoad = async (req, res) => {
  //   try {
  //     let categories = await getAllCategoriesData();
  //     res.render("categories", { categories: categories });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  
  // const categoryLoad = async (req, res) => {
  //   try {
  //     const search = req.query.search || ''; // Get search query from request parameters
  //     let categories;
  
  //     if (search) {
  //       categories = await Category.find({
  //         $or: [
  //           { category_name: { $regex: '.*' + search + '.*', $options: 'i' } },
  //           { category_description: { $regex: '.*' + search + '.*', $options: 'i' } },
  //         ],
  //       });
  //     } else {
  //       categories = await Category.find({});
  //     }
  
  //     res.render("categories", { categories: categories, search: search }); // Pass search query to the template
  //   } catch (error) {
  //     console.log(error);
  //     res.status(500).send("Internal Server Error");
  //   }
  // };
  
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
  
  
  

  const adminDashboard=async(req,res)=>{
    try{
        
        var search=''
        if(req.query.search){
            search=req.query.search
        }
        const usersData=await User.find({is_admin:0,
            $or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {email:{$regex:'.*'+search+'.*',$options:'i'}},
                {mobile:{$regex:'.*'+search+'.*',$options:'i'}},
            ]
        })
        console.log("DAsh board")
        res.render('dashboard',{users:usersData})
    }
    catch(error){
       console.log(error.message)
    }
}
  
  
  
  
  //===========================get All the Categories===============================//
  
  const getAllCategoriesData = async (req, res) => {
    return new Promise(async (resolve, reject) => {
      let categoryData = await Category.find({});
      resolve(categoryData);
    });
  };
  
  
  //==============================load the add category Page===========================//
  
  
  const addcategoryLoad = async (req, res) => {
    try {
      res.render("addcategories");
    } catch (error) {
      console.log(error);
    }
  };

  

 
  
  
  
  //=============================to add the category ===================//
  
 

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
    let categoryDetails = await takeOneUserData(req.query.id);
    console.log(categoryDetails);
    res.render("editCategories", { categories: categoryDetails });
  } catch (error) {
    console.log(error);
  }
};

//==================to take One User data=================================//

const takeOneUserData = async (categoryId) => {
  try {
    let categoryDetails = await Category.find({ _id: categoryId });
    return categoryDetails;
  } catch (error) {
    console.log(error);
  }
};

//===================to Update the category===================================//

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


const unlistCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.findById(id);

    if (category) {
      category.is_listed = !category.is_listed;
      await category.save();
    }

    const categories = await Category.find({});
    // res.render("categories", { categories: categories });
    res.redirect("/admin/categories");
  } catch (error) {
    console.log(error);
  }
};



const blockOrNot = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await userModel.findOne({ _id: id });
    if (userData.is_verified == true) {
      const List = await userModel.updateOne(
        { _id: id },
        { $set: { is_verified: false } }
      );

      // if (List) {
      //   req.session.user_id = false;
      // }
      res.redirect("/admin/customers");
    }
    if (userData.is_verified == false) {
      await userModel.updateOne({ _id: id }, { $set: { is_verified: true } });

      res.redirect("/admin/customers");
    }
  } catch (error) { 
    console.log(error);
  }
}; 

// const blockOrNot = async (req, res) => {
//   try {
//     const id = req.query.id;
//     const userData = await userModel.findOne({ _id: id });

//     // Display a confirmation dialog
//     const confirmed = window.confirm(
//       userData.is_verified
//         ? "Are you sure you want to block this user?"
//         : "Are you sure you want to unblock this user?"
//     );

//     if (!confirmed) {
//       // If the user cancels the confirmation, do nothing
//       res.redirect("/admin/customers");
//       return;
//     }

//     if (userData.is_verified == true) {
//       const List = await userModel.updateOne(
//         { _id: id },
//         { $set: { is_verified: false } }
//       );

//       if (List) {
//         req.session.user_id = false;
//       }
//       res.redirect("/admin/customers");
//     }

//     if (userData.is_verified == false) {
//       await userModel.updateOne({ _id: id }, { $set: { is_verified: true } });

//       res.redirect("/admin/customers");
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };



const productLoadd = async (req, res) => {
  try {
      let products = await productModel.find().populate("category");
      const categories = await categoryModel.find();
      res.render('products', {
          productss: products,
          Category: categories,
      });
  } catch (error) {
      console.log(error);
  }
}




const loadaddProduct=async(req,res)=>{
  try {
      res.render('addproduct')
  } catch (error) {
      console.log(error.message )
  }
}
const addProductd = async (req, res) => {
  try {
    const name = req.body.name;
    if (name.trim().length == 0) {
      res.redirect("/admin/products");
    } else {
      const already = await productModel.findOne({
        name: { $regex: name, $options: "i" },
      });
      if (already) {
        res.render("addproducts", { message: "The Product already exits" });
      } else {
        const productData = new productModel({ name: name });
        const addData = await productData.save();
        console.log(productData);
        console.log(addData);

        if (addData) {
          res.redirect("/admin/products");
        } else {
          res.render("addcategories", { message: "Something went Wrong" });
        }
      }
    }
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

// const orderLoad=async(req,res)=>{
//   try {
//       res.render('orders')
//   } catch (error) {
//       console.log(error.message )
//   }
// }
// const orderLoad = async (req, res) => {
//   try {
//     // Check if there is an active admin session
//     // if (!req.session.admin_id) {
//     //   return res.redirect('/admin/login?errors=Please log in to view');
//     // }

//     // Fetch all orders
//     const orders = await Order.find({}).sort({ orderDate: -1 });

//     // Check if orders data is not null or undefined
//     if (orders) {
//       res.render('orders', { orders });
//     } else {
//       console.log('Orders Data is null or undefined');
//       res.render('orders', { orders: [] });
//     }
//   } catch (error) {
//     console.log(error);
//     res.render('orders', { orders: [], error: 'Error fetching orders data' });
//   }
// };

const orderLoad = async (req, res) => {
  try {
    // Fetch all orders
    const orders = await Order.find({}).sort({ orderDate: -1 });

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


const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;

    // Find the order in the database
    const order = await Order.findById(orderId);

    // Check if the order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Update the order status
    order.status = newStatus;
    await order.save();

    // Redirect back to the order details page or orders page
    res.redirect('/admin/orders');
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
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
    updateOrderStatus
   
}