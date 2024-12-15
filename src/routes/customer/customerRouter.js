import { PATH } from "../../config/path.js";
import express from "express";
import { verifyRole } from "../../middlewares/authMiddlewares.js";
import { getMenuDropDownItem } from "../../controllers/menuController/menuDropdownController.js";
import {
  addDishPreorder,
  createTableBooking,
  orderTableController,
  preorderController,
} from "../../controllers/orderTable/orderTableController.js";
import { menuController } from "../../controllers/menuController/getMenu.js";

const customerRouter = express.Router();
const customerRole = "Khách hàng";
customerRouter.get("/", verifyRole(customerRole), async (req, res) => {
  try {
    // Lấy dữ liệu menu từ controller
    const menuDropDownData = await getMenuDropDownItem();
    // Render view và truyền dữ liệu menu vào
    res.render("customer/home", {
      activePage: "home",
      user: req.user || null,
      menuDropDownData,
    });
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu menu:", err);
    res.status(500).send("Lỗi khi lấy dữ liệu menu");
  }
});
customerRouter.get(
  PATH.CUSTOMER.TABLE_BOOKING,
  verifyRole(customerRole),
  orderTableController,
);

customerRouter.post(PATH.CUSTOMER.TABLE_BOOKING, createTableBooking);

customerRouter.get(
  PATH.CUSTOMER.MENU,
  verifyRole(customerRole),
  menuController,
);

customerRouter.get(
  PATH.CUSTOMER.TABLE_BOOKING_PREORDER,
  verifyRole(customerRole),
  preorderController,
);

customerRouter.post(PATH.CUSTOMER.TABLE_BOOKING_PREORDER, addDishPreorder);

customerRouter.get(
  PATH.CUSTOMER.CART,
  verifyRole(customerRole),
  async (req, res) => {
    try {
      // Lấy dữ liệu menu từ controller
      const menuDropDownData = await getMenuDropDownItem();

      // Render view và truyền dữ liệu menu vào
      res.render("customer/cart", {
        activePage: "cart",
        user: req.user || null,
        menuDropDownData,
      });
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu menu:", err);
      res.status(500).send("Lỗi khi lấy dữ liệu menu");
    }
  },
);

export default customerRouter;
