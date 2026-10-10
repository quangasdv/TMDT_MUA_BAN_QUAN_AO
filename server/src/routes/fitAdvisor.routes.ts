import { Router } from "express";
import { FitAdvisorController } from "../controllers/fitAdvisor.controller";

const router = Router();

router.post("/fit-advisor/recommend", FitAdvisorController.recommendSize);

export default router;
