import { PATH } from "../../config/path.js";
import express from "express";
import { verifyRole } from "../../middlewares/authMiddlewares.js";
import {
  getSalaries,
  updateSalaries,
} from "../../controllers/company/UpdateSalary.js"; // Adjust the import path
import {
  getRevenuePage,
  getRevenueData,
} from "../../controllers/company/statisticDish.js"; // Adjust the import path
const companyRouter = express.Router();
const companyRole = "Quản lý công ty";
companyRouter.get(PATH.HOME, verifyRole(companyRole), (req, res) => {
  res.render("company/company_home");
});

companyRouter.get(
  PATH.COMPANY.RESOURCE,
  verifyRole(companyRole),
  (req, res) => {
    res.render("company/company_resource");
  },
);

companyRouter.get(
  PATH.COMPANY.RESOURCE_TRANSFER,
  verifyRole(companyRole),
  (req, res) => {
    res.render("company/company_resource_transfer");
  },
);

companyRouter.get(
  PATH.COMPANY.RESOURCE_UPDATE,
  verifyRole(companyRole),
  (req, res) => {
    res.render("company/company_resource_update");
  },
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
