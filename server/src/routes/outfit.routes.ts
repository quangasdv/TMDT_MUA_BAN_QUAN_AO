import { Router } from "express";
import { OutfitController } from "../controllers/outfit.controller";

const router = Router();

router.get("/outfits", OutfitController.getOutfits);
router.get("/outfits/slots", OutfitController.getOutfitSlots);

export default router;
