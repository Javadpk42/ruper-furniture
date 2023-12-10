const mongoose=require("mongoose");
const userSchema=new mongoose.Schema({
   username:{
    type:String,
    required:true
   },
   email:{
    type:String,
    required:true
   },
   mobile:{
    type:String,
    required:false
   },
   
   password:{
    type:String,
    required:false
   },
   
   is_verified: {
      type: Boolean,
      default: false
    },
    referralCode: {
      type: String,
      unique: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
   token:{
      type:String,
      default:''
    },
    wallet : {
      type : Number,
      default : 0
  },
  walletHistory: [
      {
        date: {
          type: Date,
        },
        amount: {
          type: Number
        },
        description: {
          type: String,
        },
        transactionType:{
          type:String
        },
      },
    ],
    registrationDate: {
      type: Date,
      default: Date.now,
    },
         

});
module.exports=mongoose.model('User',userSchema)
