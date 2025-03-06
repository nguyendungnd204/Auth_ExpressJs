const { date } = require('joi');
const Product = require('../models/productModel');
const { createProductSchema } = require('../middlewares/validator');

exports.getProducts = async (req, res) => {
    const {page} = req.query;
    const productPerPage = 10;
    try {
        let pageNum = 0;
        if(page <= 1){
            pageNum = 0;
        }else{
            pageNum = page - 1;
        }
        const result = await Product.find().sort({createdAt: -1}).skip(pageNum * productPerPage);

        res.status(200).json({success: true, message: "All products", data: result});
    } catch (error) {
        console.log(error);
    }
};
exports.getProductById = async (req, res) => {
    const {_id} = req.query;
    try {
        const result = await Product.findOne({_id});
        if(!result){
            return res
                .status(404)
                .json({success: false, message: "No Data", data: result});
        }
        res.status(200).json({success: true, message:"Product By Id", data: result});
    } catch (error) {
        console.log(error);
    }
};

exports.createProduct = async (req, res) => {
    const {name, category, quantity, price} = req.body;
    try {
        const {error} = createProductSchema.validate({
            name,
            category,
            quantity,
            price,
        })
        if(error) {
            return res.status(400).json({success: false, message: error.details[0].message});
        }
        const result = await Product.create({
            name, category, quantity, price
        });
        res.status(201).json({success: true, message: "Created", data: result});
    } catch (error) {
        console.log(error);
    }
};

exports.updateProduct = async (req, res) => {
    const {name, category, quantity, price} = req.body;
    const {_id} = req.query;
    try {
        const {error} = createProductSchema.validate({
            name,
            category,
            quantity,
            price,
        });
        if(error) {
            return res  
                .status(400).json({success: false, message: error.details[0].message});
        }
        const result = await Product.findOne({_id});
        if(!result) {
            return res
                .status(404).json({success: false, message: "Not found product"})
        }
        result.name = name;
        result.category = category;
        result.quantity = quantity;
        result.price = price;
        
        const resultUpdated = await result.save();
        res.status(200).json({success: true, message:"Updated", data: resultUpdated});
        
    } catch (error) {
        console.log(error);
    }
};

exports.deleteProduct = async (req, res) => {
    const {_id} = req.query;
    
    try {
        const result = await Product.findOne({_id});
        if(!result){
            return res
                .status(404).json({success: false, message: "Cannot found"});
        }
        await Product.deleteOne({_id});
        res.status(204).json({success: true, message: "delete complete!"});
    } catch (error) {
        console.log(error);
    }
}