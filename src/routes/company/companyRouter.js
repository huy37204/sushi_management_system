import { PATH } from "../../config/path.js";
import express from "express";
import { verifyRole } from "../../middlewares/authMiddlewares.js";

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
  }
);

companyRouter.get(
  PATH.COMPANY.RESOURCE_TRANSFER,
  verifyRole(companyRole),
  (req, res) => {
    res.render("company/company_resource_transfer");
  }
);

companyRouter.get(
  PATH.COMPANY.RESOURCE_UPDATE,
  verifyRole(companyRole),
  (req, res) => {
    res.render("company/company_resource_update");
  }
);

companyRouter.get(
  PATH.COMPANY.UPDATE_SALARY,
  verifyRole(companyRole),
  (req, res) => {
    res.render("company/company_update_salary");
  }
);

companyRouter.get(
  PATH.COMPANY.FOOD_REVENUE,
  verifyRole(companyRole),
  (req, res) => {
    res.render("company/company_food_revenue");
  }
);

export default companyRouter;
