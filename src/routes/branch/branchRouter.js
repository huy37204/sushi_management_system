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
  branchRatingControlller,
  createOfflineOrder,
  deleteOrderForm,
  offlineOrderController,
  payOrderForm,
  updateOrderController,
  updateOrderForm,
} from "../../controllers/branchController/orderController.js";
import {
  branchInvoiceController,
  getInvoice,
} from "../../controllers/branchController/invoiceController.js";
import {
  createNewCustomerCard,
  createOldCustomerCard,
  customerCardBranchController,
  deleteCard,
  getCustomerCardByPhone,
  updateCard,
  updateCardController,
} from "../../controllers/branchController/customerCardController.js";

const branchRouter = express.Router();
const branchManager = "Quản lý chi nhánh";
const employeeRole = "Nhân viên";
branchRouter.get(
  PATH.BRANCH.HOME,
  verifyRole([branchManager, employeeRole]),
  branchController,
);

branchRouter.post("/branch/:branchId/date-revenue", getBranchRevenueByDate);

branchRouter.post("/branch/:branchId/month-revenue", getBranchRevenueByMonth);

branchRouter.post("/branch/:branchId/year-revenue", getBranchRevenueByYear);

branchRouter.post(
  "/branch/:branchId/quarter-revenue",
  getBranchRevenueByQuarter,
);

branchRouter.get(
  PATH.BRANCH.EMPLOYEE_LIST,
  verifyRole([branchManager, employeeRole]),
  employeeBranchController,
);

branchRouter.get(
  PATH.BRANCH.EMPLOYEE_SEARCH,
  verifyRole([branchManager, employeeRole]),
  employeeSearchController,
);

branchRouter.post(PATH.BRANCH.EMPLOYEE_SEARCH, getEmployeeRating);

branchRouter.get(
  PATH.BRANCH.ORDER,
  verifyRole([branchManager, employeeRole]),
  branchFormController,
);

branchRouter.get(
  "/branch/:branchId/order-form/offline-order",
  verifyRole([branchManager, employeeRole]),
  offlineOrderController,
);

branchRouter.post(
  "/branch/:branchId/order-form/offline-order",
  createOfflineOrder,
);

branchRouter.get(
  "/branch/:branchId/order-form/update",
  verifyRole([branchManager, employeeRole]),
  updateOrderController,
);

branchRouter.post("/branch/:branchId/order-form/update", updateOrderForm);

branchRouter.post("/branch/:branchId/order-form/pay", payOrderForm);

branchRouter.post("/branch/:branchId/order-form/delete", deleteOrderForm);

branchRouter.get(
  PATH.BRANCH.INVOICE,
  verifyRole([branchManager, employeeRole]),
  branchInvoiceController,
);

branchRouter.post(PATH.BRANCH.INVOICE, getInvoice);

branchRouter.get(
  "/branch/:branchId/order-form/branch-rating",
  verifyRole([branchManager, employeeRole]),
  branchRatingControlller,
);

branchRouter.post("/branch/:branchId/order-form/branch-rating", payOrderForm);

branchRouter.get(
  PATH.BRANCH.CUSTOMER_CARD,
  verifyRole([branchManager, employeeRole]),
  customerCardBranchController,
);

branchRouter.get(
  "/branch/:branchId/customer-card/new-customer-card",
  (req, res) => {
    const { branchId } = req.params;
    const { user } = req.user;
    res.render("branch/branch_create_card_for_new", { branchId, user });
  },
);

branchRouter.post(
  "/branch/:branchId/customer-card/new-customer-card",
  createNewCustomerCard,
);

branchRouter.get(
  "/branch/:branchId/customer-card/old-customer-card",
  (req, res) => {
    const { branchId } = req.params;
    const { user } = req.user;
    res.render("branch/branch_create_card_for_old", { branchId, user });
  },
);

branchRouter.post(
  "/branch/:branchId/customer-card/old-customer-card",
  createOldCustomerCard,
);
branchRouter.post("/branch/:branchId/customer-card/delete", deleteCard);

branchRouter.get(
  "/branch/:branchId/customer-card/update",
  updateCardController,
);

branchRouter.post("/branch/:branchId/customer-card/update", updateCard);

branchRouter.post(PATH.BRANCH.CUSTOMER_CARD, getCustomerCardByPhone);
export default branchRouter;
