import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import teamsRouter from "./teams";
import categoriesRouter from "./categories";
import statsRouter from "./stats";
import settingsRouter from "./settings";
import sofascoreRouter from "./sofascore";
import leaguesRouter from "./leagues";
import usersRouter from "./users";
import columnsRouter from "./columns";
import rolesRouter from "./roles";
import authRouter from "./auth";
import homepageRouter from "./homepage";
import siteSettingsRouter from "./site-settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(articlesRouter);
router.use(teamsRouter);
router.use(categoriesRouter);
router.use(statsRouter);
router.use(settingsRouter);
router.use(sofascoreRouter);
router.use(leaguesRouter);
router.use(usersRouter);
router.use(columnsRouter);
router.use(rolesRouter);
router.use(authRouter);
router.use(homepageRouter);
router.use(siteSettingsRouter);

export default router;
