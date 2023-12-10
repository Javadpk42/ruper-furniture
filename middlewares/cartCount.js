


const Cart = require("../model/cartModel");
const Wishlist = require("../model/wishlistModel");

const fetchCartAndWishlistData = async (req, res, next) => {
  try {
    const userId = req.session.user_id;

    if (userId) {
      const cart = await Cart.findOne({ user: userId }).populate('products.productId');
      const wishlist = await Wishlist.findOne({ user: userId }).populate('products.productId');

      if (cart) {
        // Update cart count in session based on the fetched cart data
        req.session.cart_count = cart.products.length;
        res.locals.productsInCart = cart;
      } else {
        // If the cart is empty, set cart count to 0
        req.session.cart_count = 0;
      }

      if (wishlist) {
        // Update wishlist count in session based on the fetched wishlist data
        req.session.wishlist_count = wishlist.products.length;
        res.locals.productsInWishlist = wishlist;
      } else {
        // If the wishlist is empty, set wishlist count to 0
        req.session.wishlist_count = 0;
      }
    }

    // Add session to res.locals
    res.locals.session = req.session;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = fetchCartAndWishlistData;
