import { Router } from "express";
import { OutfitController } from "../controllers/outfit.controller";

const router = Router();

// Hỗ trợ cả 2 endpoint: /combos và /outfits (cho tính năng Mua theo Combo / Set thời trang)
router.get("/combos", OutfitController.getCombos);
router.get("/combos/:id", OutfitController.getComboById);

router.get("/outfits/slots", OutfitController.getOutfitSlots);
router.get("/outfits", OutfitController.getCombos);
router.get("/outfits/:id", OutfitController.getComboById);

export default router;
