import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminAuthRouter from "./admin-auth";
import repairsRouter from "./repairs";
import siteContentRouter from "./site-content";
import emailsRouter from "./emails";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminAuthRouter);
router.use(repairsRouter);
router.use(siteContentRouter);
router.use(emailsRouter);

export default router;
