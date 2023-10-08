const express=require('express')
const app=express()
app.get('/',(req,res)=>{
    res.send("javad")
})
const port=3000 
app.listen(port,()=>{
    console.log(`server running at http://localhost:${port}`)
}) 