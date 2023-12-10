const mongoose=require('mongoose')

const addressSchema = new mongoose.Schema({
    user_id:{
        type:mongoose.Types.ObjectId,
        ref:"User",
        required:true,
    },

    address:[{
    fullname:{
        type:String,
        required:true
    },
  
    mobile:{
        type:Number,
        required:true
    },
   
    housename: {
        type: String,
        required:true,
      },
      city: {
        type: String,
        required:true,
      },
      state: {
        type: String,
        required:true,
      },
      district:{
        type:String,
        required:true,
        trim:true, 
      },
    pin:{
        type:String,
        required:true
    },
}]

})


module.exports=mongoose.model('address',addressSchema)