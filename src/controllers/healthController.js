const { testConnection } = require('../utils/db');
const logger = require('../utils/logger');

/**
 * Health check endpoint
 */
async function healthCheck(req, res) {
  try {
    const dbHealthy = await testConnection();
    
    if (dbHealthy) {
      res.status(200).json({
        status: 'ok',
        db: 'healthy'
      });
    } else {
      res.status(503).json({
        status: 'error',
        db: 'unhealthy'
      });
    }
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      db: 'unhealthy'
    });
  }
}

module.exports = {
  healthCheck,
};