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
const menuData = {
  appetizers: [
    {
      name: "Salad rau mùa sốt",
      price: 68000,
      originalPrice: 70000,
      imageUrl:
        "https://bizweb.dktcdn.net/thumb/large/100/469/097/products/untitled1-1.jpg?v=1667882668260",
      discount: 3,
    },
    {
      name: "Phở cuốn",
      price: 55000,
      originalPrice: 60000,
      imageUrl:
        "https://bizweb.dktcdn.net/thumb/large/100/469/097/products/untitled1f119f567b16045a78f61d.jpg?v=1667882617523",
      discount: 8,
    },
  ],
  mainCourses: [
    {
      name: "Ba rọi nướng riềng mẻ",
      price: 120000,
      originalPrice: 150000,
      imageUrl:
        "https://bizweb.dktcdn.net/thumb/large/100/469/097/products/1240f05c5ee174bcdaf47d5ec33197.jpg?v=1667882506833",
      discount: 20,
    },
    {
      name: "Ba rọi chiên mắm ngò",
      price: 90000,
      originalPrice: 100000,
      imageUrl:
        "https://bizweb.dktcdn.net/thumb/large/100/469/097/products/17ad3f36d9db047aa93f83dc10abc6.jpg?v=1667882482780",
      discount: 10,
    },
  ],
  soups: [
    {
      name: "Bún bò",
      price: 70000,
      originalPrice: 80000,
      imageUrl:
        "https://bizweb.dktcdn.net/thumb/large/100/469/097/products/12544e4d15a994948a261d455eee51.jpg?v=1667882376433",
      discount: 5,
    },
  ],
};
const customerRouter = express.Router();
const customerRole = "Khách hàng";
customerRouter.get("/", verifyRole(customerRole), async (req, res) => {
  try {
    // Lấy dữ liệu menu từ controller
    const menuDropDownData = await getMenuDropDownItem();
    // Render view và truyền dữ liệu menu vào
    res.render("customer/home", {
      activePage: "home",
      menuData, // Truyền danh sách menu vào view
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
  async (req, res) => {
    try {
      // Lấy dữ liệu menu từ controller
      const menuDropDownData = await getMenuDropDownItem();

      // Render view và truyền dữ liệu menu vào
      res.render("customer/menu", {
        activePage: "menu",
        user: req.user || null,
        menuData,
        menuDropDownData,
      });
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu menu:", err);
      res.status(500).send("Lỗi khi lấy dữ liệu menu");
    }
  },
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
