import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import teamsRouter from "./teams";
import categoriesRouter from "./categories";
import statsRouter from "./stats";
import scraperRouter from "./scraper";

const router: IRouter = Router();

router.use(healthRouter);
router.use(articlesRouter);
router.use(teamsRouter);
router.use(categoriesRouter);
router.use(statsRouter);
router.use(scraperRouter);

export default router;
