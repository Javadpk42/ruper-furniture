const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')


const wishlistSchema = new mongoose.Schema({

    user : {
        type : ObjectId,
        ref : 'User',
        required: true
    },

    products : [{

        productId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'product',
            required: true
        }
    }]
})

module.exports = mongoose.model('wishlist' , wishlistSchema)