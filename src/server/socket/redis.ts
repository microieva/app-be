import { createClient } from 'redis';

let redisClient = createClient({
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
    console.info('Redis connected successfully');
  } catch (err) {
    connectionAttempts++;
    if (connectionAttempts >= MAX_RETRIES) {
      console.error(`Redis connection failed after ${MAX_RETRIES} attempts`);
      process.exit(1);
    }
    console.warn(`Retrying Redis connection (attempt ${connectionAttempts})...`);
    setTimeout(connectWithRetry, 1000 * connectionAttempts);
  }
};

redisClient.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.error('Redis refused connection - is the server running?');
  } else {
    console.error('Redis error:', err);
  }
});

export { redisClient, connectWithRetry };