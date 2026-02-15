const logger = require('../utils/logger');


async function processPayment(amount, orderId) {
  logger.info(`Processing payment for order ${orderId}, amount: ${amount}`);

  await new Promise(resolve => setTimeout(resolve, 100));

  const success = true;
  
  if (success) {
    const transactionId = `txn_${Date.now()}_${orderId}`;
    logger.info(`Payment successful for order ${orderId}, transaction ID: ${transactionId}`);
    return { success: true, transactionId };
  } else {
    logger.error(`Payment failed for order ${orderId}`);
    return { success: false };
  }
}

module.exports = {
  processPayment,
};