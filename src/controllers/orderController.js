const orderService = require('../services/orderService');
const logger = require('../utils/logger');

/**
 * Create a new order
 */
async function createOrder(req, res) {
  try {
    const { userId, items } = req.body;

 
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request. userId and items array are required.' 
      });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Each item must have productId and quantity > 0' 
        });
      }
    }

    const order = await orderService.createOrder(userId, items);
    
    res.status(201).json(order);
  } catch (error) {
    logger.error('Error creating order:', error);
    
    // Handle specific error cases
    if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get order details
 */
async function getOrder(req, res) {
  try {
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await orderService.getOrderDetails(orderId);
    
    res.status(200).json(order);
  } catch (error) {
    logger.error('Error fetching order:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}


async function cancelOrder(req, res) {
  try {
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await orderService.cancelOrder(orderId);
    
    res.status(200).json(order);
  } catch (error) {
    logger.error('Error canceling order:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('Cannot cancel')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createOrder,
  getOrder,
  cancelOrder,
};