const mongoose = require('mongoose');

// Define the order schema
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  cart: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    products: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      statusLevel: {
        type: Number,
        default: 1
      },
      price: {
        type: Number,
        default: 0,
      },
      orderStatus: {
        type: String,
        enum: ['Placed', 'Shipped','Out for delivery', 'Delivered', 'Cancelled'],
        default: 'Placed',
      },
      returnOrder:{
        status:{
          type:String
        },
        reason:{
          type:String
        }
        
      },

    }],
  },

  deliveryAddress: {
    fullname: {
      type: String,
      required: true,
    },
    mobile: {
      type: Number,
      required: true,
    },
    housename: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    pin: {
      type: String,
      required: true,
    },
  },
  paymentOption: {
    type: String,
    enum: ['COD', 'PayPal', 'Razorpay'], 
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  expectedDelivery:{
    type:Date,
    required:true
  }


  // You can add more fields as needed, such as order items, order status, etc.
});

// Create and export the Order model
module.exports = mongoose.model('order', orderSchema);