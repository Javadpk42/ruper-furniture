const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
        status: {
          type: Boolean,
          default: false, 
        },
        returnStatus: {
          type: String,
          enum: ['Placed', 'Out for pickup','Returned','Refund'],
          default: 'Placed',
        },
        statusLevel: {
          type: Number,
          default: 1
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
    enum: ['COD', 'PayPal', 'Razorpay','Wallet'], 
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  couponCode: {
    type: String,
    default: null, 
  },
  couponDiscount: {
    type: Number,
    default: 0,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  expectedDelivery:{
    type:Date,
    required:true
  },
  status: {
    type: Boolean,
    default: false,
  },



});

module.exports = mongoose.model('order', orderSchema);