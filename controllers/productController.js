const { createProductSchema } = require('../middlewares/validator');
const productService = require('../services/productService');
const { AppError } = require('../middlewares/errorHandler');

exports.getProducts = async (req, res, next) => {
    try {
        const { page } = req.query;
        const products = await productService.getAllProducts(page);
        
        res.status(200).json({
            success: true, 
            message: 'All products', 
            data: products
        });
    } catch (error) {
        next(error);
    }
};

exports.getProductById = async (req, res, next) => {
    try {
        const { _id } = req.query;
        const product = await productService.getProductById(_id);
        
        res.status(200).json({
            success: true, 
            message: 'Product By Id', 
            data: product
        });
    } catch (error) {
        next(error);
    }
};

exports.createProduct = async (req, res, next) => {
    try {
        const { name, category, quantity, price } = req.body;
        
        const { error } = createProductSchema.validate({
            name,
            category,
            quantity,
            price,
        });

        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const product = await productService.createProduct(name, category, quantity, price);
        
        res.status(201).json({
            success: true, 
            message: 'Product created successfully', 
            data: product
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const { name, category, quantity, price } = req.body;
        const { _id } = req.query;

        const { error } = createProductSchema.validate({
            name,
            category,
            quantity,
            price,
        });

        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const updatedProduct = await productService.updateProduct(_id, name, category, quantity, price);
        
        res.status(200).json({
            success: true, 
            message: 'Product updated successfully', 
            data: updatedProduct
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const { _id } = req.query;
        
        await productService.deleteProduct(_id);
        
        res.status(204).json({
            success: true, 
            message: 'Product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
