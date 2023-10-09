const express=require('express')
const app=express()

const mongoos=require('mongoose');
const path=require('path')
mongoos.connect("mongodb://127.0.0.1:27017/zudio");
// app.get('/',(req,res)=>{
//     res.send("javad")
// })
app.use("/public", express.static(path.join(__dirname, './public')));

const userRoute=require('./routes/userRoute')
app.use('/',userRoute)

// const port=3000 
// app.listen(port,()=>{
//     console.log(`server running at http://localhost:${port}`)
// }) 
app.listen(3000,function(){
    console.log("server is running @ http://localhost:3000")
})            