import { sql } from "../../database/dbConnection.js";
import { getMenuDropDownItem } from "../menuController/menuDropdownController.js";
export const menuController = async (req, res) => {
  try {
    const branchId = req.body.branchId || req.query.branchId;
    const branchName = req.body.branchName;
    const dishName = req.query.dishName;
    const request = new sql.Request();

    // Lấy danh sách chi nhánh
    const branchesResult = await request.execute("GetBranches");
    const branchesData = branchesResult.recordset;

    let categoriesWithDishes = [];
    const menuDropDownData = await getMenuDropDownItem();

    if (dishName) {
      console.log("Hàm tìm kiếm món ăn đã được gọi.");
      request.input("BranchId", sql.NVarChar, branchId);
      request.input("DishName", sql.NVarChar, `%${dishName}%`);

      const menuResult = await request.execute("GetMenuByDishName");
      const menuData = menuResult.recordset;
      categoriesWithDishes = menuData.map((row) => ({
        categoryName: row.CATEGORY_NAME,
        dishes: row.DISHES ? JSON.parse(row.DISHES) : [],
      }));
    } else if (branchId) {
      request.input("BranchId", sql.NVarChar, branchId);

      const menuResult = await request.execute("GetMenuByBranchId");
      const menuData = menuResult.recordset;
      categoriesWithDishes = menuData.map((row) => ({
        categoryName: row.CATEGORY_NAME,
        dishes: row.DISHES ? JSON.parse(row.DISHES) : [],
      }));
    }

    // Render view với dữ liệu
    res.render("customer/menu", {
      activePage: "menu",
      menuDropDownData,
      user: req.user || null,
      branches: branchesData,
      selectedBranchId: branchId,
      selectedBranchName: branchName,
      membershipCard: req.session.membershipCard || null,
      categoriesWithDishes,
    });
  } catch (error) {
    console.error("Lỗi khi tải menu:", error);
    res.status(500).send("Lỗi khi tải menu.");
  }
};

export const deliveryOrder = async (req, res) => {
  try {
    const { branchId } = req.query;
    const dishes = req.body.dishes;

    // Gọi stored procedure GetMaxOrderID
    const request1 = new sql.Request(); // First request instance for GetMaxOrderID
    const result1 = await request1.execute("GetMaxOrderID");
    let maxOrderID = result1.recordset[0].MaxOrderID || "O000000";
    const numericPart = parseInt(maxOrderID.substring(1)) + 1;
    const newOrderID = `O${numericPart.toString().padStart(6, "0")}`;

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const vietnamTime = new Date(
      now.getTime() + 7 * 60 * 60 * 1000 + 60 * 1000,
    ); // Cộng thêm 7 giờ và 1 phút
    // Set delivery time 30 minutes later
    const deliveryDateTime = new Date(now);
    deliveryDateTime.setMinutes(vietnamTime.getMinutes() + 30);

    // Gọi stored procedure CreateOrder
    const request2 = new sql.Request(); // Second request instance for CreateOrder
    await request2
      .input("OrderId", sql.Char(7), newOrderID)
      .input("OrderDate", sql.Date, date)
      .input("BranchId", sql.Char(4), branchId)
      .input("CustomerId", sql.Char(7), req.user.id)
      .input("OrderType", sql.VarChar(20), "Delivery")
      .input("OrderTime", sql.Time, vietnamTime) // Pass the Date object directly
      .execute("CreateOrder");

    // Gọi stored procedure CreateDeliveryOrder
    const request3 = new sql.Request(); // Third request instance for CreateDeliveryOrder
    await request3
      .input("OrderId", sql.Char(7), newOrderID)
      .input("DeliveryDate", sql.Date, date)
      .input("DeliveryTime", sql.Time, deliveryDateTime) // Pass the Date object directly
      .execute("CreateDeliveryOrder");

    // Xử lý các món ăn đặt trước
    const validDishes = Object.entries(dishes)
      .filter(([key, quantity]) => Number(quantity) > 0)
      .map(([key, quantity]) => ({ dishId: key, quantity: Number(quantity) }));

    if (validDishes.length === 0) {
      return res.redirect("/");
    }

    // Gọi stored procedure AddOrderDish cho mỗi món ăn
    const insertPromises = validDishes.map(async (dish) => {
      const { dishId, quantity } = dish;
      const request4 = new sql.Request(); // Fourth request instance for AddOrderDish
      return request4
        .input("OrderId", sql.Char(7), newOrderID)
        .input("DishId", sql.Char(7), dishId)
        .input("Quantity", sql.Int, quantity)
        .execute("AddOrderDish");
    });

    await Promise.all(insertPromises);

    res.redirect("/");
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({
      message: "Lỗi khi xử lý đơn hàng",
      error: error.message,
    });
  }
};
