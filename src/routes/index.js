import { PATH } from "../config/path.js";
import express from "express";
import accountRouter from "./authentication/accountRouter.js";
import customerRouter from "./customer/customerRouter.js";
import branchRouter from "./branch/branchRouter.js";
import companyRouter from "./company/companyRouter.js";
import employeeRouter from "./employee/employeeRouter.js";

const router = express.Router();

router.use(PATH.HOME, accountRouter);

router.use(PATH.HOME, customerRouter);

router.use(PATH.BRANCH.PATH, branchRouter);

router.use(PATH.COMPANY.PATH, companyRouter);

router.use(PATH.EMPLOYEE.PATH, employeeRouter);

export default router;
