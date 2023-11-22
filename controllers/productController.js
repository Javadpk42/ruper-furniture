const Category = require("../model/productModel").category;
const fileUpload= require('../middlewares/fileUpload')
const Product = require("../model/productModel").product;
const path = require("path");
const sharp = require('sharp');
const fs = require('fs');

const getProductDetails = async(id)=>{
  try {
    let product=await Product.find({_id:id})
    return product[0]
  } catch (error) {
    console.log(error);
  }
}





const productsLoad = async (req, res) => {
  try {
    const search = req.query.search || ''; // Get search query from request parameters
    const page = parseInt(req.query.page) || 1; // Get page number from request parameters, default to 1
    const limit = 4; // Set the number of items per page
 
    let products;
    let count;

    if (search) {
      products = await Product.find({
        $or: [
          { product_name: { $regex: '.*' + search + '.*', $options: 'i' } },
          { category: { $regex: '.*' + search + '.*', $options: 'i' } },
        ],
      })
        .skip((page - 1) * limit)
        .limit(limit);

      count = await Product.find({
        $or: [
          { product_name: { $regex: '.*' + search + '.*', $options: 'i' } },
          { category: { $regex: '.*' + search + '.*', $options: 'i' } },
        ],
      }).countDocuments();
    } else {
      products = await Product.find({})
        .skip((page - 1) * limit)
        .limit(limit);

      count = await Product.countDocuments({});
    }

    const totalPages = Math.ceil(count / limit);

    res.render("products", {
      products: products,
      search: search,
      currentPage: page,
      totalPages: totalPages,
    }); // Pass search query and pagination details to the template
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};






const addProductLoad = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.render("addProduct", { categories: categories });
  } catch (error) {
    console.log(error);
  }
};







const addProduct = async (req, res) => {
  try {
    console.log("Entered to add product");
    let details = req.body;
    console.log("Form Details:", details);

    // Read the cropped images and convert them to file format (JPEG)
    const croppedImage1Buffer = Buffer.from(details.croppedImageData1.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
    const croppedImage2Buffer = Buffer.from(details.croppedImageData2.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
    const croppedImage3Buffer = Buffer.from(details.croppedImageData3.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
    const croppedImage4Buffer = Buffer.from(details.croppedImageData4.replace(/^data:image\/jpeg;base64,/, ''), 'base64');

    // Assuming your Product model has fields for image1, image2, image3, and image4
    const product = new Product({
      product_name: details.product_name,
      product_price: details.product_price,
      category: details.category,
      is_listed: true,
      stock: details.stock,
      product_description: details.product_description,
      images: {
        image1: 'image1_' + Date.now() + '.jpg', // Save the filename or path to the image
        image2: 'image2_' + Date.now() + '.jpg',
        image3: 'image3_' + Date.now() + '.jpg',
        image4: 'image4_' + Date.now() + '.jpg',
      },
    });

    // Save the image files to the server (assuming 'public/products/images' is the destination)
    fs.writeFileSync(path.join(__dirname, '../public/products/images', product.images.image1), croppedImage1Buffer);
    fs.writeFileSync(path.join(__dirname, '../public/products/images', product.images.image2), croppedImage2Buffer);
    fs.writeFileSync(path.join(__dirname, '../public/products/images', product.images.image3), croppedImage3Buffer);
    fs.writeFileSync(path.join(__dirname, '../public/products/images', product.images.image4), croppedImage4Buffer);

    // Save the product details to the database
    const result = await product.save();
    console.log(result);
    
    // Redirect to the products page after successful submission
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    // Handle errors, perhaps by sending an error response
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};





 










//===================to unlist the Product===========================//

// const unlistProduct = async (req, res) => {
//   let id = req.query.id;
//   console.log(id);
//   let product = await Product.findById(id);
//   if (product) {
//     product.is_listed = !product.is_listed;
//     await product.save();
//   }

//   const products = await Product.find({});
//   // res.render("products", { products: products });
//   res.redirect("/admin/products");
// };

const unlistProduct = async (req, res) => {
  let id = req.body.id; // Use req.body to get the product ID from the form submission
  console.log(id);
  let product = await Product.findById(id);
  if (product) {
    product.is_listed = !product.is_listed;
    await product.save();
  }

  const products = await Product.find({});
  res.redirect("/admin/products");
};



//==================to load the edit product page=================//

// const editProductLoad = async(req,res)=>{
//   try {
//     const categories = await Category.find({});
//     const product = await getProductDetails(req.query.id)
//     res.render('editproducts',{
//       product:product,
//       categories:categories})
//   } catch (error) {
//     console.log(error);
//   }
// }

const editProductLoad = async (req, res) => {
  try {
    const categories = await Category.find({});
    const product = await getProductDetails(req.query.id);
    res.render('editproducts', {
      product: product,
      categories: categories,
    });
  } catch (error) {
    console.log(error);
  }
};



// const editProduct= async(req,res)=>{
//   try {
//     let details=req.body;
//     let imagesFiles= req.files;
//     let currentData= await getProductDetails(req.query.id);

//     let img1,img2,img3,img4;

//       img1 = imagesFiles.image1 ? imagesFiles.image1[0].filename : currentData.images.image1;
//       img2 = imagesFiles.image2 ? imagesFiles.image2[0].filename : currentData.images.image2;
//       img3 = imagesFiles.image3 ? imagesFiles.image3[0].filename : currentData.images.image3;
//       img4 = imagesFiles.image4 ? imagesFiles.image4[0].filename : currentData.images.image4;

//       const update= await Product.updateOne(
//         {_id:req.query.id},
//         {
//           $set:{
//             product_name:details.product_name,
//             product_price:details.product_price,
//             category:details.category,
//             gender:details.category,
//             product_description:details.product_description,
//             stock:details.stock,
//             "images.image1": img1,
//             "images.image2": img2,
//             "images.image3": img3,
//             "images.image4": img4
//           }
//         })
//         console.log(update);

//         res.redirect('/admin/products')
//   } catch (error) {
//     console.log(error);
//   }
// }

// const editProduct = async (req, res) => {
//   try {
//     console.log(req.body)
//     console.log(req.files)
//     let details = req.body;
//     let imagesFiles = req.files;
//     let currentData = await getProductDetails(req.query.id);

//     let img1, img2, img3, img4;

//     img1 = imagesFiles.image1 ? imagesFiles.image1[0].filename : currentData.images.image1;
//     img2 = imagesFiles.image2 ? imagesFiles.image2[0].filename : currentData.images.image2;
//     img3 = imagesFiles.image3 ? imagesFiles.image3[0].filename : currentData.images.image3;
//     img4 = imagesFiles.image4 ? imagesFiles.image4[0].filename : currentData.images.image4;

//     const update = await Product.updateOne(
//       { _id: req.query.id },
//       {
//         $set: {
//           product_name: details.product_name,
//           product_price: details.product_price,
//           category: details.category,
//           gender: details.category, // Assuming gender is a property in your schema
//           product_description: details.product_description,
//           stock: details.stock,
//           "images.image1": img1,
//           "images.image2": img2,
//           "images.image3": img3,
//           "images.image4": img4,
//         },
//       }
//     );

//     console.log(update);

//     res.redirect('/admin/products');
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// };

const editProduct = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.files);
    let details = req.body;
    let imagesFiles = req.files;
    let currentData = await getProductDetails(req.query.id);

    let img1, img2, img3, img4;

    img1 = imagesFiles.image1 ? imagesFiles.image1[0].filename : currentData.images.image1;
    img2 = imagesFiles.image2 ? imagesFiles.image2[0].filename : currentData.images.image2;
    img3 = imagesFiles.image3 ? imagesFiles.image3[0].filename : currentData.images.image3;
    img4 = imagesFiles.image4 ? imagesFiles.image4[0].filename : currentData.images.image4;

    // Update only the fields that need to be changed
    const updateFields = {
      product_name: details.product_name,
      product_price: details.product_price,
      category: details.category,
      gender: details.category, // Assuming gender is a property in your schema
      product_description: details.product_description,
      stock: details.stock,
    };

    // Check if croppedImageData exists in the request
    if (details.croppedImageData1) {
      const croppedImageBuffer1 = Buffer.from(details.croppedImageData1.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
      fs.writeFileSync(path.join(__dirname, '../public/products/images', img1), croppedImageBuffer1);
    }

    if (details.croppedImageData2) {
      const croppedImageBuffer2 = Buffer.from(details.croppedImageData2.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
      fs.writeFileSync(path.join(__dirname, '../public/products/images', img2), croppedImageBuffer2);
    }

    if (details.croppedImageData3) {
      const croppedImageBuffer3 = Buffer.from(details.croppedImageData3.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
      fs.writeFileSync(path.join(__dirname, '../public/products/images', img3), croppedImageBuffer3);
    }

    if (details.croppedImageData4) {
      const croppedImageBuffer4 = Buffer.from(details.croppedImageData4.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
      fs.writeFileSync(path.join(__dirname, '../public/products/images', img4), croppedImageBuffer4);
    }

    // Update the images in the database
    updateFields["images.image1"] = img1;
    updateFields["images.image2"] = img2;
    updateFields["images.image3"] = img3;
    updateFields["images.image4"] = img4;

    const update = await Product.updateOne({ _id: req.query.id }, { $set: updateFields });

    console.log(update);

    res.redirect('/admin/products');
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};





module.exports = {
  addProductLoad,
  addProduct,
  productsLoad,
  unlistProduct,
  editProductLoad,
  editProduct
};