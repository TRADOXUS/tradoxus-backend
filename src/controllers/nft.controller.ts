import { NextFunction, Request, Response } from "express";
import { getNFTs } from "../services/nft.service"
import { Address } from "@stellar/stellar-sdk";

export async function getNFTsController(req: Request, res: Response, next: NextFunction) {
    try {
        const walletAddress = req.query.walletAddress as string;
        if (!walletAddress) {
            throw new Error("No wallet address sent");
        }

        const page = Number(req.query.page as string);
        const limit = Number(req.query.limit as string);

        if (isNaN(page) || isNaN(limit)) {
            throw new Error("Invalid page or limit value, value must be a number");
        }

        const address = new Address(walletAddress);
        const data = await getNFTs({
            walletAddress: address,
            page,
            limit
        });

        return data;
    } catch (err) {
        next(err)
    }
}
