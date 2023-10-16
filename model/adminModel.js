const mongoose=require("mongoose");
const adminSchema=new mongoose.Schema({
  
   email:{
    type:String,
    required:true
   },
  
   
   password:{
    type:String,
    required:true
   },
   
   is_admin:{
    type:Number,
    default:0
   }
         

});
module.exports=mongoose.model('Admin',adminSchema)