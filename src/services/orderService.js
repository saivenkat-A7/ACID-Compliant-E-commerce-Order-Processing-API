const { prisma } = require('../utils/db');
const logger = require('../utils/logger');
const { processPayment } = require('./paymentService');


async function createOrder(userId, items) {
  const transactionId = `txn_${Date.now()}`;
  
  logger.info('TRANSACTION_START', { transactionId, userId, items });

  try {
    
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Validate user exists
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Step 2: Check inventory and prepare order items
      const orderItemsData = [];
      let totalAmount = 0;

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        // Check stock availability
        if (product.stock < item.quantity) {
          logger.error('INVENTORY_CHECK_FAILED', { 
            transactionId, 
            productId: item.productId, 
            requested: item.quantity, 
            available: product.stock 
          });
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }

        logger.info('INVENTORY_CHECK_SUCCESS', { 
          transactionId, 
          productId: item.productId, 
          quantity: item.quantity 
        });

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        });

        totalAmount += parseFloat(product.price) * item.quantity;

        // Step 3: Decrease stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // Step 4: Create order
      const order = await tx.order.create({
        data: {
          userId,
          status: 'processing',
          totalAmount,
          orderItems: {
            create: orderItemsData
          }
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      logger.info('ORDER_CREATED', { transactionId, orderId: order.id });

      // Step 5: Process payment (simulated)
      const paymentResult = await processPayment(totalAmount, order.id);

      if (!paymentResult.success) {
        logger.error('PAYMENT_FAILURE', { transactionId, orderId: order.id });
        throw new Error('Payment processing failed');
      }

      // Step 6: Create payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          status: 'succeeded'
        }
      });

      logger.info('PAYMENT_SUCCESS', { transactionId, orderId: order.id });
      logger.info('TRANSACTION_COMMIT', { transactionId, orderId: order.id });

      return order;
    }, {
      maxWait: 5000, // Maximum time to wait for a transaction slot
      timeout: 10000, // Maximum time the transaction can run
    });

    return {
      orderId: result.id,
      status: result.status,
      totalAmount: parseFloat(result.totalAmount)
    };

  } catch (error) {
    logger.error('TRANSACTION_ROLLBACK', { transactionId, error: error.message });
    throw error;
  }
}


async function getOrderDetails(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true
        }
      },
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return {
    orderId: order.id,
    status: order.status,
    totalAmount: parseFloat(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    user: {
      id: order.user.id,
      email: order.user.email
    },
    items: order.orderItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: parseFloat(item.price)
    }))
  };
}


async function cancelOrder(orderId) {
  const transactionId = `cancel_txn_${Date.now()}`;
  
  logger.info('CANCEL_TRANSACTION_START', { transactionId, orderId });

  try {
    const result = await prisma.$transaction(async (tx) => {
      
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: true
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      
      if (order.status === 'cancelled') {
        logger.info('ORDER_ALREADY_CANCELLED', { transactionId, orderId });
        return order;
      }

     
      if (order.status === 'shipped' || order.status === 'delivered') {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }

     
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
        
        logger.info('INVENTORY_RESTORED', { 
          transactionId, 
          productId: item.productId, 
          quantity: item.quantity 
        });
      }

      
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' }
      });

      logger.info('CANCEL_TRANSACTION_COMMIT', { transactionId, orderId });

      return updatedOrder;
    });

    return {
      orderId: result.id,
      status: result.status
    };

  } catch (error) {
    logger.error('CANCEL_TRANSACTION_ROLLBACK', { transactionId, orderId, error: error.message });
    throw error;
  }
}

module.exports = {
  createOrder,
  getOrderDetails,
  cancelOrder,
};