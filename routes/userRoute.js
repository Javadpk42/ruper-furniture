const express=require('express');
const user_route=express();

user_route.use(express.urlencoded({ extended: true }));

user_route.set('view engine','ejs');
user_route.set('views','./views/user')


const userController=require('../controllers/userController')

user_route.get('/',userController.homeLoad)
user_route.get('/shop',userController.shopLoad)
// user_route.get('/shopdetails',userController.shopdetailsLoad)
user_route.get('/shopdetails/:productId', userController.shopdetailsLoad);


user_route.get('/login',userController.loginLoad)
user_route.post('/login',userController.verifyLogin)

user_route.get('/signup',userController.loadRegister);
user_route.post('/signup',userController.insertUser);

user_route.get('/otpverification',userController.loadOtp);
user_route.post('/otpverification',userController.verifyOTP);
user_route.post('/resendOTP',userController.resendOTP);


module.exports=user_route;

