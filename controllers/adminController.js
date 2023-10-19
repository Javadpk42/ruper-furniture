const userModel = require("../model/userModel")
const adminModel = require("../model/userModel")

const Category = require("../model/productModel").category;
const { category } = require("../model/productModel");

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
                  req.session.user_id=userData._id
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

const usersLoad = async (req,res)=>{
    try {
      let users= await getAllUserData() 
      res.render('customers',{userss:users})
    } catch (error) {
      console.log(error);
    }
  }
   
  
  const getAllUserData = async (req,res)=>{
    return new Promise(async(resolve,reject)=>{
      let userData = await userModel.find({})
      resolve(userData)
    })
  }

  const categoryLoad = async (req, res) => {
    try {
      let categories = await getAllCategoriesData();
      res.render("categories", { categories: categories });
    } catch (error) {
      console.log(error);
    }
  };
  
  
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
    res.render("categories", { categories: categories });
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

      if (List) {
        req.session.user_id = false;
      }
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
module.exports={
    loginLoad,
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
    verifyLogin
   
}