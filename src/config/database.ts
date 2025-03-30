import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "course_management",
    synchronize: process.env.NODE_ENV !== "production", // Only true in development
    logging: process.env.NODE_ENV !== "production",
    migrations: [__dirname + "/../migrations/**/*.ts"],
    subscribers: [__dirname + "/../subscribers/**/*.ts"],
    entities: ["src/entities/**/*.ts"],
}); 