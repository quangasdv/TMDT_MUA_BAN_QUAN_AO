import { Router } from "express";
import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import cartRoutes from "./cart.routes";
import voucherRoutes from "./voucher.routes";
import checkoutRoutes from "./checkout.routes";
import paymentRoutes from "./payment.routes";
import fitAdvisorRoutes from "./fitAdvisor.routes";
import outfitRoutes from "./outfit.routes";
import adminRoutes from "./admin.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/", productRoutes);
apiRouter.use("/", cartRoutes);
apiRouter.use("/", voucherRoutes);
apiRouter.use("/", checkoutRoutes);
apiRouter.use("/", paymentRoutes);
apiRouter.use("/", fitAdvisorRoutes);
apiRouter.use("/", outfitRoutes);
apiRouter.use("/", adminRoutes);

export default apiRouter;
