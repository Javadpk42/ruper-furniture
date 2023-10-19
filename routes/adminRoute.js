const express=require('express');
const admin_route=express();
const multer= require('multer') 

admin_route.use(express.urlencoded({ extended: true }));
const adminAuth = require('../middlewares/admin')

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin')


const adminController=require('../controllers/adminController')
const productController = require('../controllers/productController')
const fileUpload= require('../middlewares/fileUpload')



admin_route.get('/',adminAuth.isLogout,adminController.loginLoad)
admin_route.post('/',adminAuth.isLogout,adminController.verifyLogin)

admin_route.get('/dashboard',adminAuth.isLogin,adminController.loaddashboard)

admin_route.get('/customers',adminAuth.isLogin,adminController.usersLoad)
admin_route.get('/is_verified',adminController.blockOrNot)

admin_route.get('/categories',adminAuth.isLogin,adminController.categoryLoad)
admin_route.get('/unlistCategory',adminController.unlistCategory)

admin_route.get('/addcategories',adminAuth.isLogin,adminController.addcategoryLoad)
admin_route.post('/addcategories',adminAuth.isLogin,adminController.addCategory)

admin_route.get('/editCategory',adminAuth.isLogin,adminController.editCategoryLoad)
admin_route.post('/editCategory',adminAuth.isLogin,adminController.updateCategoryData)


admin_route.get('/products',adminAuth.isLogin,productController.productsLoad)
admin_route.get('/unlistProduct',productController.unlistProduct)

admin_route.get('/addproducts',adminAuth.isLogin,productController.addProductLoad)
admin_route.post('/addproducts',adminAuth.isLogin,fileUpload.productImagesUpload,productController.addProduct)

admin_route.get('/editproduct',adminAuth.isLogin,productController.editProductLoad)
admin_route.post('/editproduct',adminAuth.isLogin,fileUpload.productImagesUpload,productController.editProduct)

module.exports=admin_route;