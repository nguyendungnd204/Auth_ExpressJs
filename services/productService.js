const Product = require('../models/productModel');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

class ProductService {
    async getAllProducts(page) {
        const productPerPage = 10;
        const pageNum = page <= 1 ? 0 : page - 1;
        
        const products = await Product.find()
            .sort({createdAt: -1})
            .skip(pageNum * productPerPage);
            
        return products;
    }

    async getProductById(_id) {
        const product = await Product.findOne({ _id });
        
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        
        return product;
    }

    async createProduct(name, category, quantity, price) {
        const product = await Product.create({
            name, 
            category, 
            quantity, 
            price
        });
        
        logger.info(`New product created: ${name}`);
        return product;
    }

    async updateProduct(_id, name, category, quantity, price) {
        const product = await Product.findOne({ _id });
        
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        
        product.name = name;
        product.category = category;
        product.quantity = quantity;
        product.price = price;
        
        const updatedProduct = await product.save();
        logger.info(`Product ${_id} updated`);
        
        return updatedProduct;
    }

    async deleteProduct(_id) {
        const product = await Product.findOne({ _id });
        
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        
        await Product.deleteOne({ _id });
        logger.info(`Product ${_id} deleted`);
        
        return true;
    }
}

module.exports = new ProductService(); 