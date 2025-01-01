import { PATH } from "../../config/path.js";
import express from "express";
import { verifyRole } from "../../middlewares/authMiddlewares.js";
import {
  updateSalaries,
  getSalaries
} from "../../controllers/company/UpdateSalary.js"; // Adjust the import path
import {
  getRevenuePage,
  getRevenueData,
} from "../../controllers/company/statisticDish.js"; // Adjust the import path

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

// Route for getting salaries by branch ID
companyRouter.get(
  PATH.COMPANY.UPDATE_SALARY,
  verifyRole(companyRole),
  getSalaries,
);
// API route to update salaries
companyRouter.post(
  PATH.COMPANY.UPDATE_SALARY,
  verifyRole(companyRole),
  updateSalaries,
);
companyRouter.get(
  PATH.COMPANY.FOOD_REVENUE,
  verifyRole(companyRole),
  getRevenuePage,
);
// API route to update salaries
companyRouter.post(
  PATH.COMPANY.FOOD_REVENUE,
  verifyRole(companyRole),
  getRevenueData,
);
export default companyRouter;
