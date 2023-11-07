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
    required:true
   },
   
   password:{
    type:String,
    required:true
   },
   
   is_verified: {
      type: Boolean,
      default: false
    },
   token:{
      type:String,
      default:''
    }
         

});
module.exports=mongoose.model('User',userSchema)
