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
  }
}





const productsLoad = async (req, res,next) => {
  try {
    const search = req.query.search || ''; 
    const page = parseInt(req.query.page) || 1; 
    const limit = 4; 
 
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
    }); 
  } catch (error) {
    next(error);
  }
};






const addProductLoad = async (req, res,next) => {
  try {
    const categories = await Category.find({});
    res.render("addproduct", { categories: categories });
  } catch (error) {
    next(error);

  }
};







const addProduct = async (req, res,next) => {
  try {
    let details = req.body;

    const croppedImage1Buffer = Buffer.from(details.croppedImageData1.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
    const croppedImage2Buffer = Buffer.from(details.croppedImageData2.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
    const croppedImage3Buffer = Buffer.from(details.croppedImageData3.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
    const croppedImage4Buffer = Buffer.from(details.croppedImageData4.replace(/^data:image\/jpeg;base64,/, ''), 'base64');

    const product = new Product({
      product_name: details.product_name,
      product_price: details.product_price,
      category: details.category,
      is_listed: true,
      stock: details.stock,
      product_description: details.product_description,
      images: {
        image1: 'image1_' + Date.now() + '.jpg', 
        image2: 'image2_' + Date.now() + '.jpg',
        image3: 'image3_' + Date.now() + '.jpg',
        image4: 'image4_' + Date.now() + '.jpg',
      },
    });

    fs.writeFileSync(path.join(__dirname, '../public/products/images', product.images.image1), croppedImage1Buffer);
    fs.writeFileSync(path.join(__dirname, '../public/products/images', product.images.image2), croppedImage2Buffer);
    fs.writeFileSync(path.join(__dirname, '../public/products/images', product.images.image3), croppedImage3Buffer);
    fs.writeFileSync(path.join(__dirname, '../public/products/images', product.images.image4), croppedImage4Buffer);

    const result = await product.save();
    
    res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};





 












const unlistProduct = async (req, res) => {
  let id = req.body.id; 
  let product = await Product.findById(id);
  if (product) {
    product.is_listed = !product.is_listed;
    await product.save();
  }

  const products = await Product.find({});
  res.redirect("/admin/products");
};




const editProductLoad = async (req, res,next) => {
  try {
    const categories = await Category.find({});
    const product = await getProductDetails(req.query.id);
    res.render('editproducts', {
      product: product,
      categories: categories,
    });
  } catch (error) {
    next(error);

  }
};





const editProduct = async (req, res,next) => {
  try {
    let details = req.body;
    let imagesFiles = req.files;
    let currentData = await getProductDetails(req.query.id);

    let img1, img2, img3, img4;

    img1 = imagesFiles.image1 ? imagesFiles.image1[0].filename : currentData.images.image1;
    img2 = imagesFiles.image2 ? imagesFiles.image2[0].filename : currentData.images.image2;
    img3 = imagesFiles.image3 ? imagesFiles.image3[0].filename : currentData.images.image3;
    img4 = imagesFiles.image4 ? imagesFiles.image4[0].filename : currentData.images.image4;

    const updateFields = {
      product_name: details.product_name,
      product_price: details.product_price,
      category: details.category,
      gender: details.category, 
      product_description: details.product_description,
      stock: details.stock,
    };

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

    updateFields["images.image1"] = img1;
    updateFields["images.image2"] = img2;
    updateFields["images.image3"] = img3;
    updateFields["images.image4"] = img4;

    const update = await Product.updateOne({ _id: req.query.id }, { $set: updateFields });


    res.redirect('/admin/products');
  } catch (error) {
    next(error);
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