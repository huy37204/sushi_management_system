import { PATH } from "../../config/path.js";
import express from "express";
import { verifyRole } from "../../middlewares/authMiddlewares.js";
import sql from "mssql";

const branchRouter = express.Router();
const branchManager = "Quản lý chi nhánh";

// Middleware để lấy branchId
branchRouter.use(async (req, res, next) => {
  try {
    const user = req.user; // Giả sử `req.user` đã có thông tin người dùng từ middleware xác thực trước đó
    const request = new sql.Request();
    request.input("userId", sql.NVarChar, user.id);

    const result = await request.query(`
      SELECT B.BRANCH_ID
      FROM RESTAURANT_BRANCH B
      WHERE B.MANAGER_ID = @userId
    `);

    if (result.recordset.length > 0) {
      req.branchId = result.recordset[0].BRANCH_ID; // Lưu branchId vào req
      next();
    } else {
      return res.status(404).send("Branch not found");
    }
  } catch (error) {
    console.error("Error fetching branchId:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Routes
branchRouter.get(PATH.HOME, verifyRole(branchManager), (req, res) => {
  res.render("branch/branch_home", {
    branchId: req.branchId, // Truyền branchId vào render
  });
});

branchRouter.get(
  PATH.BRANCH.EMPLOYEE_LIST,
  verifyRole(branchManager),
  (req, res) => {
    res.render("branch/branch_employee_list", {
      branchId: req.branchId, // Truyền branchId vào render
    });
  },
);

branchRouter.get(
  PATH.BRANCH.EMPLOYEE_SEARCH,
  verifyRole(branchManager),
  (req, res) => {
    res.render("branch/branch_employee_search", {
      branchId: req.branchId, // Truyền branchId vào render
    });
  },
);

branchRouter.get(PATH.BRANCH.ORDER, verifyRole(branchManager), (req, res) => {
  res.render("branch/branch_order_form", {
    branchId: req.branchId, // Truyền branchId vào render
  });
});

branchRouter.get(PATH.BRANCH.INVOICE, verifyRole(branchManager), (req, res) => {
  res.render("branch/branch_invoice", {
    branchId: req.branchId, // Truyền branchId vào render
  });
});

branchRouter.get(
  PATH.BRANCH.CUSTOMER_CARD,
  verifyRole(branchManager),
  (req, res) => {
    res.render("branch/branch_customer_card", {
      branchId: req.branchId, // Truyền branchId vào render
    });
  },
);

export default branchRouter;
