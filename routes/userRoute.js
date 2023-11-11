const express=require('express');
const user_route=express();

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

user_route.set('view engine','ejs');
user_route.set('views','./views/user')

const userAuth = require('../middlewares/userAuth')
const userController=require('../controllers/userController')


user_route.get('/',userController.homeLoad) 

user_route.get('/signup',userController.loadSignup);
user_route.post('/signup',userController.sendOtp);
user_route.get('/otpverification',userController.loadOtp);
user_route.post('/resendotp',userController.resendOtp);
user_route.post('/otpverification',userController.verifyOtp);

user_route.get('/login',userController.loginLoad)
user_route.post('/login',userController.verifyLogin) 
user_route.get('/logout',userController.userLogout)


user_route.get('/forgotpassword',userController.forgotLoad)
user_route.post('/forgotpassword',userController.forgotVerify) 
user_route.get('/resetpassword',userController.resetpasswordLoad)
user_route.post('/resetpassword',userController.resetPassword)
 
user_route.get('/profile',userController.profileLoad)
user_route.get('/orderdetails/:orderId', userController.orderDetails); 
user_route.post('/cancelorder/:orderId', userController.cancelOrderAjax);



user_route.post('/update_profile',userController.updateProfile)
user_route.post('/password_change',userController.passwordChange)
user_route.post('/add_address',userController.addAddress)
user_route.get('/edit_address/:addressId', userController.editAddressPage);
user_route.post('/edit_address/:addressId', userController.editAddress);

user_route.post('/delete_address/:addressId', userController.deleteAddress);

  
user_route.get('/shop',userController.shopLoad)
user_route.get('/shopdetails/:productId', userController.shopdetailsLoad);

user_route.post('/add-to-cart',userController.addToCart)
user_route.get('/view-cart',userController.getCartProducts) 
user_route.post('/cart-quantity',userController.cartQuantity)  
user_route.post('/remove-product',userController.removeProductRouteHandler) 

user_route.get('/checkout',userController.loadCheckout)
user_route.get('/edit_address_checkout/:addressId', userController.editAddressPagecheckout);
user_route.post('/edit_address_checkout/:addressId', userController.editAddresscheckout);
user_route.post('/add_shipping_address', userController.addShippingAddress)




user_route.post('/placeOrder', userController.placeOrder)
 

user_route.post('/verifyPayment',userController.verifyPayment)

user_route.get('/orderplaced', userController.orderPlaced)  


user_route.get('/add_wallet', userController.loadaddwallet)  
user_route.post('/add_wallet',userController.addMoneyWallet)

user_route.post('/verify_wallet',userController.verifyWalletpayment)
user_route.get('/wallethistory', userController.loadwalletHistory) 
 

  
module.exports=user_route;


 
 


   