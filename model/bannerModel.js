const mongoose = require( 'mongoose' )

const Schema = mongoose.Schema

const bannerSchema = Schema( {
 
    typeHead : {
        type : String 
    },

    mainHead : {
        type : String
    },
    image : {
        type : String 
    },
    bannerURL :{
        type: String
    },

    status : {
        default : true,
        type: Boolean
    }

})

module.exports = mongoose.model( 'banner', bannerSchema)