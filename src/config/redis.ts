import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => console.error(`Redis client error: ${err}`));

const connectToRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
            console.log('Connected to redis');
        }
    } catch (error) {
        console.error('Failed to connect to redis: ', error);
    }
};

export { redisClient, connectToRedis };
