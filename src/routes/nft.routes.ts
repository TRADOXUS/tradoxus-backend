import { Router, Request, Response } from "express";
import { getNFTsController } from "../controllers/nft.controller";

const router = Router();

router.get('/', getNFTsController);
  
export default router;
