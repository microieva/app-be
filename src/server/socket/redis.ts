import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from '@redis/client';
import logger from '../../utils/logger';


let redisClient: RedisClientType<RedisModules, RedisFunctions, RedisScripts> = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    connectTimeout: 5000,
    tls: false
  }
});

const MAX_RETRIES = 3;
let connectionAttempts = 0;

const connectWithRetry = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    connectionAttempts++;
    if (connectionAttempts >= MAX_RETRIES) {
      logger.error(`Redis connection failed after ${MAX_RETRIES} attempts`);
      process.exit(1);
    }
    logger.warn(`Retrying Redis connection (attempt ${connectionAttempts})...`);
    setTimeout(connectWithRetry, 1000 * connectionAttempts);
  }
};

redisClient.on('connect', () => {
  logger.info('Redis connection established', { 
    url: process.env.REDIS_URL,
    timestamp: new Date().toISOString()
  });
});

redisClient.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    logger.error('Redis refused connection - is the server running?');
  } else {
    logger.error('Redis error:', err);
  }
});

export { redisClient, connectWithRetry };