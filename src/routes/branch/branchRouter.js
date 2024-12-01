import { PATH } from "../../config/path.js";
import express from "express";

const branchRouter = express.Router();

branchRouter.get(PATH.HOME, (req, res) => {
  res.render("branch/branch_home");
});
branchRouter.get(PATH.BRANCH.EMPLOYEE_LIST, (req, res) => {
  res.render("branch/branch_employee_list");
});
branchRouter.get(PATH.BRANCH.EMPLOYEE_SEARCH, (req, res) => {
  res.render("branch/branch_employee_search");
});

branchRouter.get(PATH.BRANCH.ORDER, (req, res) => {
  res.render("branch/branch_order_form");
});

branchRouter.get(PATH.BRANCH.INVOICE, (req, res) => {
  res.render("branch/branch_invoice");
});

branchRouter.get(PATH.BRANCH.CUSTOMER_CARD, (req, res) => {
  res.render("branch/branch_customer_card");
});
export default branchRouter;
