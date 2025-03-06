const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');

router.get('/products', productController.getProducts);
router.get('/productById', productController.getProductById);
router.post('/create', productController.createProduct);
module.exports = router;