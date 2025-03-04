const { required, number } = require('joi');
const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name:{
        type: String,
        required: [true, "name is required!"],
        trim: true,
    },
    category:{
        type: String,
        required: [true, "category is required!"],
        trim: true,
    },
    quantity: {
        type: Number,
    },
    price: {
        type: Number,
    }
    
}, {
    timestamps: true
});

module.exports = mongoose.model("Product", productSchema);