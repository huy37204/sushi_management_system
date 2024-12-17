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
  getEmployeeRating,
} from "../../controllers/branchController/employeeBranchController.js";
import {
  branchFormController,
  createOfflineOrder,
  deleteOrderForm,
  offlineOrderController,
  payOrderForm,
  updateOrderController,
  updateOrderForm,
} from "../../controllers/branchController/formController.js";
import {
  branchInvoiceController,
  getInvoice,
} from "../../controllers/branchController/invoiceController.js";

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

branchRouter.post(PATH.BRANCH.EMPLOYEE_SEARCH, getEmployeeRating);

branchRouter.get(
  PATH.BRANCH.ORDER,
  verifyRole(branchManager),
  branchFormController,
);

branchRouter.get(
  "/branch/:branchId/order-form/offline-order",
  verifyRole(branchManager),
  offlineOrderController,
);

branchRouter.post(
  "/branch/:branchId/order-form/offline-order",
  createOfflineOrder,
);

branchRouter.get(
  "/branch/:branchId/order-form/update",
  verifyRole(branchManager),
  updateOrderController,
);

branchRouter.post("/branch/:branchId/order-form/update", updateOrderForm);

branchRouter.post("/branch/:branchId/order-form/pay", payOrderForm);

branchRouter.post("/branch/:branchId/order-form/delete", deleteOrderForm);

branchRouter.get(
  PATH.BRANCH.INVOICE,
  verifyRole(branchManager),
  branchInvoiceController,
);

branchRouter.post(PATH.BRANCH.INVOICE, getInvoice);

branchRouter.get(
  PATH.BRANCH.CUSTOMER_CARD,
  verifyRole(branchManager),
  (req, res) => {
    res.render("branch/branch_customer_card");
  },
);
export default branchRouter;
