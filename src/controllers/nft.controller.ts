import { NextFunction, Request, Response } from "express";
import { getNFTs } from "../services/nft.service"
import constants from "../constants";

export async function getNFTsController(req: Request, res: Response, next: NextFunction) {
    try {
        const walletAddress = req.query.wallet_address as string;
        if (!walletAddress) {
            throw new Error("No wallet address sent");
        }

        const page = Number(req.query.page) || constants.DEFAULT_PAGE_GET_NFTS;
        const limit = Number(req.query.limit) || constants.DEFAULT_LIMIT_GET_NFTS;

        if (isNaN(page) || isNaN(limit)) {
            throw new Error("Invalid page or limit value, value must be a number");
        }

        const data = await getNFTs({
            walletAddress,
            page,
            limit
        });

        res.status(200).json({
            message: "Successfully returned NFTs for the user",
            nfts: data
        });
    } catch (err) {
        next(err)
    }
}
