const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');

// Product routes
router.get('/products', productController.getAllProducts);

// Order routes
router.post('/orders', orderController.createOrder);
router.get('/orders/:orderId', orderController.getOrder);
router.put('/orders/:orderId/cancel', orderController.cancelOrder);

module.exports = router;