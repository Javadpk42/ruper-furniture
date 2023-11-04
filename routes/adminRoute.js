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

 

admin_route.get('/',adminAuth.isAdminLogout,adminController.loginLoad)
admin_route.post('/',adminController.verifyLogin)
admin_route.get('/logout',adminController.adminLogout)

admin_route.get('/dashboard',adminAuth.isAdminLogin,adminController.loaddashboard)

admin_route.get('/customers',adminAuth.isAdminLogin,adminController.usersLoad)
admin_route.get('/is_verified',adminController.blockOrNot)

admin_route.get('/categories',adminAuth.isAdminLogin,adminController.categoryLoad)
admin_route.get('/unlistCategory',adminController.unlistCategory)

admin_route.get('/addcategories',adminAuth.isAdminLogin,adminController.addcategoryLoad)
admin_route.post('/addcategories',adminController.addCategory)

admin_route.get('/editCategory',adminAuth.isAdminLogin,adminController.editCategoryLoad)
admin_route.post('/editCategory',adminController.updateCategoryData)

 
admin_route.get('/products',adminAuth.isAdminLogin,productController.productsLoad)
admin_route.get('/unlistProduct',productController.unlistProduct)

admin_route.get('/addproducts',adminAuth.isAdminLogin,productController.addProductLoad)
admin_route.post('/addproducts',fileUpload.productImagesUpload,productController.addProduct)

admin_route.get('/editproduct',adminAuth.isAdminLogin,productController.editProductLoad)
admin_route.post('/editproduct',fileUpload.productImagesUpload,productController.editProduct)

admin_route.get('/orders',adminAuth.isAdminLogin,adminController.orderLoad)
admin_route.post('/updateOrderStatus/:orderId', adminAuth.isAdminLogin, adminController.updateOrderStatus);


module.exports=admin_route;