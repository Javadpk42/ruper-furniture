const Category = require("../model/productModel").category;
const Product = require("../model/productModel").product;
const path = require("path");

const getProductDetails = async(id)=>{
  try {
    let product=await Product.find({_id:id})
    return product[0]
  } catch (error) {
    console.log(error);
  }
}



//===================load the Product Page==============================//

const productsLoad = async (req, res) => {
  try {
    let products = await Product.find({});
    res.render("products", { products: products });
  } catch (error) {
    console.log(error);
  }
};


//==========================to load the add to product Page=======================//

const addProductLoad = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.render("addProduct", { categories: categories });
  } catch (error) {
    console.log(error);
  }
};


//===================to add the Product================================//

const addProduct = async (req, res) => {
  try {
    let details = req.body;
    const files = await req.files;
    console.log(files);

    const product = new Product({
      product_name: details.product_name,
      product_price: details.product_price,
      category: details.category,
      // gender: details.gender,
      stock: details.stock,
      product_description: details.product_description,
      "images.image1": files.image1[0].filename,
      "images.image2": files.image2[0].filename,
      "images.image3": files.image3[0].filename,
      "images.image4": files.image4[0].filename,
    });

    const result = await product.save();
    console.log(result);
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};



//===================to unlist the Product===========================//

const unlistProduct = async (req, res) => {
  let id = req.query.id;
  console.log(id);
  let product = await Product.findById(id);
  if (product) {
    product.is_listed = !product.is_listed;
    await product.save();
  }

  const products = await Product.find({});
  res.render("products", { products: products });
};

//==================to load the edit product page=================//

const editProductLoad = async(req,res)=>{
  try {
    const categories = await Category.find({});
    const product = await getProductDetails(req.query.id)
    res.render('editproducts',{
      product:product,
      categories:categories})
  } catch (error) {
    console.log(error);
  }
}

const editProduct= async(req,res)=>{
  try {
    let details=req.body;
    let imagesFiles= req.files;
    let currentData= await getProductDetails(req.query.id);

    let img1,img2,img3,img4;

      img1 = imagesFiles.image1 ? imagesFiles.image1[0].filename : currentData.images.image1;
      img2 = imagesFiles.image2 ? imagesFiles.image2[0].filename : currentData.images.image2;
      img3 = imagesFiles.image3 ? imagesFiles.image3[0].filename : currentData.images.image3;
      img4 = imagesFiles.image4 ? imagesFiles.image4[0].filename : currentData.images.image4;

      const update= await Product.updateOne(
        {_id:req.query.id},
        {
          $set:{
            product_name:details.product_name,
            product_price:details.product_price,
            category:details.category,
            gender:details.category,
            product_description:details.product_description,
            stock:details.stock,
            "images.image1": img1,
            "images.image2": img2,
            "images.image3": img3,
            "images.image4": img4
          }
        })
        console.log(update);

        res.redirect('/admin/products')
  } catch (error) {
    console.log(error);
  }
}




module.exports = {
  addProductLoad,
  addProduct,
  productsLoad,
  unlistProduct,
  editProductLoad,
  editProduct
};