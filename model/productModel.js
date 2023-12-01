const mongoose= require('mongoose');


const productSchema = mongoose.Schema({
  product_name:{
    type:String,
    required:true,
  },
  product_price:{
    type:Number,
    required:true,
  },
  discount: {
    type: Number,
    default: 0
 },
 category_discount: {
  type: Number,
  default: 0
},

discountedAmount: {
    type: Number,
    default: 0
},
  category:{
    type:String,
    required:true,
  },
  stock:{
    type:Number,
    required:true
  },
  product_description:{
    type:String,
    required:true
  },
  is_listed:{
    type:Boolean,
  },
  images:{
    image1:{
      type:String,
      required:true
    },
    image2:{
      type:String,
      required:true
    },
    image3:{
      type:String,
      required:true
    },
    image4:{
      type:String,
      required:true
    }

  },
  reviews: [
    {
      user: {
        userId:{
          type:String
        },
        username: {
          type: String,
        },
       
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],

})



const categorySchema = mongoose.Schema({
  category_name:{
    type:String,
    required:true
  },
  category_description:{
    type:String,
    required:true
  },
  is_listed:{
    type:Boolean,
  },
  discount: {
    type: Number,
    default: 0
 },
})

const product= mongoose.model('product',productSchema)
const category =mongoose.model('category',categorySchema)



module.exports= {
  category,
  product
}