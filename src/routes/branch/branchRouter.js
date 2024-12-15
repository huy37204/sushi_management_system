import { PATH } from "../../config/path.js";
import express from "express";
import { verifyRole } from "../../middlewares/authMiddlewares.js";
import {
  branchController,
  getBranchRevenueByDate,
  getBranchRevenueByMonth,
  getBranchRevenueByQuarter,
  getBranchRevenueByYear,
} from "../../controllers/branchController/branchController.js";
import {
  employeeBranchController,
  employeeSearchController,
} from "../../controllers/branchController/employeeBranchController.js";

const branchRouter = express.Router();
const branchManager = "Quản lý chi nhánh";
branchRouter.get(PATH.BRANCH.HOME, verifyRole(branchManager), branchController);

branchRouter.post("/branch/:branchId/date-revenue", getBranchRevenueByDate);

branchRouter.post("/branch/:branchId/month-revenue", getBranchRevenueByMonth);

branchRouter.post("/branch/:branchId/year-revenue", getBranchRevenueByYear);

branchRouter.post(
  "/branch/:branchId/quarter-revenue",
  getBranchRevenueByQuarter,
);

branchRouter.get(
  PATH.BRANCH.EMPLOYEE_LIST,
  verifyRole(branchManager),
  employeeBranchController,
);
branchRouter.get(
  PATH.BRANCH.EMPLOYEE_SEARCH,
  verifyRole(branchManager),
  employeeSearchController,
);

branchRouter.get(PATH.BRANCH.ORDER, verifyRole(branchManager), (req, res) => {
  res.render("branch/branch_order_form");
});

branchRouter.get(PATH.BRANCH.INVOICE, verifyRole(branchManager), (req, res) => {
  res.render("branch/branch_invoice");
});

branchRouter.get(
  PATH.BRANCH.CUSTOMER_CARD,
  verifyRole(branchManager),
  (req, res) => {
    res.render("branch/branch_customer_card");
  },
);
export default branchRouter;
