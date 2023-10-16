const express=require('express');
const admin_route=express();
const multer= require('multer') 

admin_route.use(express.urlencoded({ extended: true }));

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin')


const adminController=require('../controllers/adminController')
const productController = require('../controllers/productController')
const fileUpload= require('../middlewares/fileUpload')


admin_route.get('/login',adminController.loginLoad)
admin_route.post('/login',adminController.verifyLogin)

admin_route.get('/dashboard',adminController.loaddashboard)

admin_route.get('/customers',adminController.usersLoad)
admin_route.get('/is_verified',adminController.blockOrNot)

admin_route.get('/categories',adminController.categoryLoad)
admin_route.get('/unlistCategory',adminController.unlistCategory)

admin_route.get('/addcategories',adminController.addcategoryLoad)
admin_route.post('/addcategories',adminController.addCategory)

admin_route.get('/editCategory',adminController.editCategoryLoad)
admin_route.post('/editCategory',adminController.updateCategoryData)


admin_route.get('/products',productController.productsLoad)
admin_route.get('/unlistProduct',productController.unlistProduct)

admin_route.get('/addproducts',productController.addProductLoad)
admin_route.post('/addproducts',fileUpload.productImagesUpload,productController.addProduct)

admin_route.get('/editproduct',productController.editProductLoad)
admin_route.post('/editproduct',productController.editProduct)

module.exports=admin_route;