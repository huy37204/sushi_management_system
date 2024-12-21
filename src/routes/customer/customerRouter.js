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
import {
  menuController,
  deliveryOrder,
} from "../../controllers/menuController/getMenu.js";

const customerRouter = express.Router();
const customerRole = "Khách hàng";

customerRouter.get("/", verifyRole(customerRole), async (req, res) => {
  try {
    // Lấy dữ liệu menu từ controller
    const menuDropDownData = await getMenuDropDownItem();
    // Render view và truyền dữ liệu menu và thẻ thành viên vào
    res.render("customer/home", {
      activePage: "home",
      user: req.user || null,
      menuDropDownData,
      membershipCard: req.session.membershipCard || null, // Thêm thẻ thành viên vào đây
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

customerRouter.post(
  PATH.CUSTOMER.MENU,
  verifyRole(customerRole),
  deliveryOrder,
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

      // Render view và truyền dữ liệu menu và thẻ thành viên vào
      res.render("customer/cart", {
        activePage: "cart",
        user: req.user || null,
        menuDropDownData,
        membershipCard: req.session.membershipCard || null, // Thêm thẻ thành viên vào đây
      });
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu menu:", err);
      res.status(500).send("Lỗi khi lấy dữ liệu menu");
    }
  },
);

export default customerRouter;
