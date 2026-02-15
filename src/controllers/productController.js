const { prisma } = require('../utils/db');
const logger = require('../utils/logger');


async function getAllProducts(req, res) {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        stock: true
      }
    });

    
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      stock: product.stock
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getAllProducts,
};