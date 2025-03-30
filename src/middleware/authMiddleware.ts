import { Request, Response, NextFunction } from "express";
import * as jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        res.status(400).json({
            error: "Could not find authorization header"
        })
        return;
    }

    const token = authorization.split(' ')[1];
    if (!token) {
        res.status(400).json({
            error: "Could not find authorization token"
        })
        return;
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
        res.status(400).json({
            error: `Error verifying user's jwt token: ${err}`
        })
        return;
    }
    next();
};
