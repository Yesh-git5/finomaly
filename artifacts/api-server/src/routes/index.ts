import { Router, type IRouter } from "express";
import healthRouter from "./health";
import finomalyRouter from "./finomaly";

const router: IRouter = Router();

router.use(healthRouter);
router.use(finomalyRouter);

export default router;
