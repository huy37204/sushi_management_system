import { PATH } from "../../config/path.js";
import express from "express";
import { verifyRole } from "../../middlewares/authMiddlewares.js";
import {
  companyController,
  getCompanyRevenueByDate,
  getCompanyRevenueByMonth,
  getCompanyRevenueByQuarter,
  getCompanyRevenueByYear,
} from "../../controllers/companyController/companyController.js";
import {
  addResource,
  addResourceController,
  deleteResource,
  resourceController,
  resourceTransferController,
  resourceUpdateController,
  transferResource,
  updateResource,
} from "../../controllers/companyController/resourceController.js";

const companyRouter = express.Router();
const companyRole = "Quản lý công ty";
companyRouter.get(
  PATH.COMPANY.HOME,
  verifyRole(companyRole),
  companyController,
);

companyRouter.post(
  "/company/date-revenue",
  verifyRole(companyRole),
  getCompanyRevenueByDate,
);

companyRouter.post(
  "/company/month-revenue",
  verifyRole(companyRole),
  getCompanyRevenueByMonth,
);

companyRouter.post(
  "/company/quarter-revenue",
  verifyRole(companyRole),
  getCompanyRevenueByQuarter,
);

companyRouter.post(
  "/company/year-revenue",
  verifyRole(companyRole),
  getCompanyRevenueByYear,
);

companyRouter.get(
  PATH.COMPANY.RESOURCE,
  verifyRole(companyRole),
  resourceController,
);

companyRouter.get(
  PATH.COMPANY.RESOURCE_TRANSFER,
  verifyRole(companyRole),
  resourceTransferController,
);

companyRouter.post(
  PATH.COMPANY.RESOURCE_TRANSFER,
  verifyRole(companyRole),
  transferResource,
);

companyRouter.get(
  PATH.COMPANY.RESOURCE_UPDATE,
  verifyRole(companyRole),
  resourceUpdateController,
);

companyRouter.post(
  PATH.COMPANY.RESOURCE_UPDATE,
  verifyRole(companyRole),
  updateResource,
);

companyRouter.post(
  "/company/resource/delete",
  verifyRole(companyRole),
  deleteResource,
);

companyRouter.get(
  "/company/resource/add",
  verifyRole(companyRole),
  addResourceController,
);

companyRouter.post(
  "/company/resource/add",
  verifyRole(companyRole),
  addResource,
);

companyRouter.get(
  PATH.COMPANY.UPDATE_SALARY,
  verifyRole(companyRole),
  (req, res) => {
    res.render("company/company_update_salary");
  },
);

companyRouter.get(
  PATH.COMPANY.FOOD_REVENUE,
  verifyRole(companyRole),
  (req, res) => {
    res.render("company/company_food_revenue");
  },
);

export default companyRouter;
