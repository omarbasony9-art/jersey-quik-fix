import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminAuthRouter from "./admin-auth";
import repairsRouter from "./repairs";
import siteContentRouter from "./site-content";
import emailsRouter from "./emails";
import stripeCheckoutRouter from "./stripe-checkout";
import productsRouter from "./products";
import adminProductsRouter from "./admin-products";
import adminOrdersRouter from "./admin-orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminAuthRouter);
router.use(repairsRouter);
router.use(siteContentRouter);
router.use(emailsRouter);
router.use(stripeCheckoutRouter);
router.use(productsRouter);
router.use(adminProductsRouter);
router.use(adminOrdersRouter);

export default router;
