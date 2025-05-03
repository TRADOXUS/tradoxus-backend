import { Request, Response } from "express";
import { NFTService } from "../services/NFTService";
import { AppError } from "../middleware/errorHandler";

export class NFTController {
  private nftService: NFTService;

  constructor() {
    this.nftService = new NFTService();
  }

  // Get all NFTs with pagination
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const walletAddress = req.query.wallet_address as string;

      const { nfts, total } = await this.nftService.getNFTs(
        walletAddress,
        page,
        limit,
      );

      res.json({
        status: "success",
        data: { nfts },
        pagination: {
          total_items: total,
          current_page: page,
          items_per_page: limit,
          total_pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}
