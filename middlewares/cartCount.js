


const Cart = require("../model/cartModel");
const Wishlist = require("../model/wishlistModel");

const fetchCartAndWishlistData = async (req, res, next) => {
  try {
    const userId = req.session.user_id;

    if (userId) {
      const cart = await Cart.findOne({ user: userId }).populate('products.productId');
      const wishlist = await Wishlist.findOne({ user: userId }).populate('products.productId');

      if (cart) {
      
        req.session.cart_count = cart.products.length;
        res.locals.productsInCart = cart;
      } else {
        req.session.cart_count = 0;
      }

      if (wishlist) {
        req.session.wishlist_count = wishlist.products.length;
        res.locals.productsInWishlist = wishlist;
      } else {
        req.session.wishlist_count = 0;
      }
    }

    res.locals.session = req.session;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = fetchCartAndWishlistData;
