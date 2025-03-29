import { Router } from "express";
import { NFTController } from "../controllers/NFTController";

const router = Router();
const nftController = new NFTController();

router.get('/', nftController.findAll.bind(nftController));
  
export default router;
