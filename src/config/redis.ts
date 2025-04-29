import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

const createRedisClient = () => {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || '6381';
    
    console.log(`Creating Redis client for ${host}:${port}`);
    
    return createClient({
        url: `redis://${host}:${port}`,
        socket: {
            connectTimeout: 10000,
            reconnectStrategy: (retries) => {
                console.log(`Redis reconnection attempt ${retries}`);
                if (retries > 10) {
                    return new Error('Max reconnection attempts reached');
                }
                return Math.min(retries * 100, 3000);
            }
        }
    });
};

const redisClient = createRedisClient();

redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
    if (err instanceof Error) {
        console.error('Error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack
        });
    }
});

redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.on('reconnecting', () => console.log('Redis client reconnecting'));
redisClient.on('ready', () => console.log('Redis client ready'));
redisClient.on('end', () => console.log('Redis client connection ended'));

const connectToRedis = async () => {
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
        try {
            console.log(`Attempting to connect to Redis (attempt ${retries + 1}/${MAX_RETRIES}) at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
            
            if (!redisClient.isOpen) {
                await redisClient.connect();
                console.log('Connected to redis successfully');
                return;
            }
        } catch (error) {
            console.error(`Connection attempt ${retries + 1} failed:`, error);
            if (error instanceof Error) {
                console.error('Connection error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            }
            
            retries++;
            if (retries < MAX_RETRIES) {
                console.log(`Waiting ${RETRY_DELAY}ms before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                console.error('Max connection attempts reached');
                throw error;
            }
        }
    }
};

export { redisClient, connectToRedis };
