import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminAuthRouter from "./admin-auth";
import repairsRouter from "./repairs";
import siteContentRouter from "./site-content";
import emailsRouter from "./emails";
import stripeCheckoutRouter from "./stripe-checkout";
import cartRouter from "./cart";
import tradeRouter from "./trade-inquiries";
import membershipRouter from "./membership";
import productsRouter from "./products";
import adminProductsRouter from "./admin-products";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminAuthRouter);
router.use(repairsRouter);
router.use(siteContentRouter);
router.use(emailsRouter);
router.use(stripeCheckoutRouter);
router.use(cartRouter);
router.use(tradeRouter);
router.use(membershipRouter);
router.use(productsRouter);
router.use(adminProductsRouter);

export default router;
