const express=require('express');
const user_route=express();

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

//
user_route.set('views','./views/user')
 
const shortid = require("shortid");

const userAuth = require('../middlewares/userAuth')
const userModel = require("../model/userModel");

const fetchCartData = require('../middlewares/cartCount');
const userController=require('../controllers/userController')
user_route.use(fetchCartData); 
user_route.use((req, res, next) => {
  res.locals.user = req.session.user_id || null;
  next();
});

const googleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');

passport.use(new googleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret:process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:"/auth/google/callback"
},async (accessToken,refreshToken,profile,done) => {
  console.log(accessToken);
  console.log(refreshToken);
  console.log(profile);
  try {
    const user = await userModel.findOne({email: profile.emails[0].value});
    const referralCode = shortid.generate();
    
    
    if(user) {
      done(null,user);
    } else {
      const newUser = new userModel({
        email: profile.emails[0].value,
        username: profile.displayName,
        is_verified:true,
        referralCode:referralCode,
        password: 'dummyPassword',
        mobile: 'dummyMobile',
      });

      await newUser.save();
      done(null,newUser);
    }
  } catch (error) {
    done(error,false);
  }
}
))

passport.serializeUser((user,done) => {
  done(null,user.id);
})


passport.deserializeUser(async(id,done)=> {
  try {
    const user= await userModel.findById(id);
    done(null,user);
  } catch (error) {
    done(error,false);
  }
})


user_route.get('/auth/google',passport.authenticate('google',{
  scope:["profile","email"]
}));

user_route.get('/auth/google/callback',passport.authenticate('google',{
  failureRedirect:'/login'
}),async function (req,res) {
  console.log(req.user.email);
  const userEmail = req.user.email;
  const user = await userModel.findOne({email:userEmail});

  if(user){
    req.session.user_id = user._id;
    res.redirect('/')
  } else {
    res.redirect('/login')
  }

})


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

user_route.get('/',userController.homeLoad) 
user_route.get('/shop',userController.shopLoad)
user_route.get('/about',userController.aboutLoad) 
user_route.get('/faq',userController.faqLoad) 
user_route.get('/contact',userController.contactLoad) 

user_route.get('/shopdetails/:productId', userController.shopdetailsLoad);
user_route.get('/review/:productId', userController.reviewLoad);

user_route.post('/submit_review',userController.submitReview)

user_route.post('/add-to-cart',userController.addToCart)
user_route.get('/view-cart',userAuth.isUserLogin,userController.getCartProducts) 
user_route.post('/cart-quantity',userController.cartQuantity)  
user_route.post('/remove-product',userController.removeProductRouteHandler) 

user_route.post('/addToWish',userController.addWishlist)
user_route.get('/wishlist',userAuth.isUserLogin,userAuth.isUserLogin,userController.loadWishlist)
user_route.delete('/wish-delete', userController.deleteWishlist)

user_route.get('/checkout',userAuth.isUserLogin,userController.loadCheckout)

user_route.get('/edit_address_checkout/:addressId',userAuth.isUserLogin, userController.editAddressPagecheckout);
user_route.post('/edit_address_checkout/:addressId', userController.editAddresscheckout);
user_route.post('/add_shipping_address', userController.addShippingAddress)

user_route.post('/apply-coupon',userController.applyCoupon)
user_route.post('/remove-coupon',userController.removeCoupon)
 
user_route.post('/placeOrder', userController.placeOrder)
user_route.post('/verifyPayment',userController.verifyPayment)
user_route.get('/orderplaced',userAuth.isUserLogin, userController.orderPlaced)
 
user_route.get('/profile',userAuth.isUserLogin,userController.profileLoad)

user_route.get('/view-all-orders',userAuth.isUserLogin,userController.allordersLoad)
user_route.get('/orderdetails/:orderId',userAuth.isUserLogin, userController.orderDetails); 
user_route.get('/invoice',userAuth.isUserLogin,userController.invoiceDownload)
user_route.post('/cancelorder/:orderId', userController.cancelOrderAjax);
user_route.post('/returnorder/:orderId', userController.returnOrderAjax);

user_route.get('/wallethistory',userAuth.isUserLogin,userController.loadwalletHistory) 
user_route.get('/add_wallet',userAuth.isUserLogin, userController.loadaddwallet)  
user_route.post('/add_wallet',userController.addMoneyWallet)
user_route.post('/verify_wallet',userController.verifyWalletpayment)

user_route.post('/update_profile',userController.updateProfile)
user_route.post('/password_change',userController.passwordChange) 

user_route.post('/add_address',userController.addAddress)
user_route.get('/edit_address/:addressId',userAuth.isUserLogin, userController.editAddressPage);
user_route.post('/edit_address/:addressId', userController.editAddress);
user_route.post('/delete_address/:addressId', userController.deleteAddress); 



  
user_route.use((err,req, res, next) => {
  res.status(500).render("500");
});

user_route.use((req, res, next)=>{
  res.status(404).render("404");
})



module.exports=user_route;


 
 
  

   