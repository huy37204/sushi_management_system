import { sql } from "../../database/dbConnection.js";
import { getMenuDropDownItem } from "../menuController/menuDropdownController.js";
export const menuController = async (req, res) => {
  try {
    const branchId = req.body.branchId || req.query.branchId; // Lấy branchId từ body hoặc query
    const branchName = req.body.branchName;
    const dishName = req.query.dishName; // Lấy dishName từ query parameters
    const request = new sql.Request();
    // Lấy danh sách chi nhánh
    const branchesData = await request.query(`
      SELECT BRANCH_ID, BRANCH_NAME FROM RESTAURANT_BRANCH
    `);

    let categoriesWithDishes = [];
    const menuDropDownData = await getMenuDropDownItem();
    
    if (dishName) {
      // Kiểm tra xem có tham số tìm kiếm không
      console.log("Hàm tìm kiếm món ăn đã được gọi.");

      request.input("branchId", sql.NVarChar, branchId);
      request.input("dishName", sql.NVarChar, `%${dishName}%`); // Sử dụng wildcard để tìm kiếm

      const searchQuery = `
        SELECT 
          MC.CATEGORY_NAME,
          (
            SELECT 
              D.DISH_ID, D.DISH_NAME, D.DISH_PRICE
            FROM 
              DISH D
            JOIN 
              DISH_AVAILABLE DA 
              ON DA.DISH_ID = D.DISH_ID AND DA.BRANCH_ID = @branchId AND DA.IS_AVAILABLE = 1
            WHERE 
              D.CATEGORY_NAME = MC.CATEGORY_NAME
              AND D.DISH_NAME LIKE @dishName -- Tìm kiếm tên món ăn
            FOR JSON PATH
          ) AS DISHES
        FROM 
          (SELECT DISTINCT CATEGORY_NAME FROM DISH) MC
        WHERE 
          EXISTS (
            SELECT 1 
            FROM DISH D
            JOIN DISH_AVAILABLE DA ON DA.DISH_ID = D.DISH_ID 
            WHERE DA.BRANCH_ID = @branchId 
            AND DA.IS_AVAILABLE = 1 
            AND D.CATEGORY_NAME = MC.CATEGORY_NAME
            AND D.DISH_NAME LIKE @dishName
          );
      `;

      const menuData = await request.query(searchQuery);
      categoriesWithDishes = menuData.recordset.map((row) => ({
        categoryName: row.CATEGORY_NAME,
        dishes: row.DISHES ? JSON.parse(row.DISHES) : [],
      }));
    } else if (branchId) {
      // Nếu không có dishName, hiển thị menu cho branchId
      request.input("branchId", sql.VarChar, branchId);

      const menuQuery = `
        SELECT 
          MC.CATEGORY_NAME,
          (
            SELECT 
              D.DISH_ID, D.DISH_NAME, D.DISH_PRICE
            FROM DISH D
            JOIN DISH_AVAILABLE DA 
              ON DA.DISH_ID = D.DISH_ID AND DA.BRANCH_ID = @branchId AND DA.IS_AVAILABLE = 1
            WHERE D.CATEGORY_NAME = MC.CATEGORY_NAME
            FOR JSON PATH
          ) AS DISHES
        FROM (SELECT DISTINCT CATEGORY_NAME FROM DISH) MC
      `;

      const menuData = await request.query(menuQuery);
      categoriesWithDishes = menuData.recordset.map((row) => ({
        categoryName: row.CATEGORY_NAME,
        dishes: row.DISHES ? JSON.parse(row.DISHES) : [],
      }));
    }

    // Render view với dữ liệu
    res.render("customer/menu", {
      activePage: "menu",
      menuDropDownData,
      user: req.user || null,
      branches: branchesData.recordset,
      selectedBranchId: branchId,
      selectedBranchName: branchName,
      categoriesWithDishes,
    });
  } catch (error) {
    console.error("Lỗi khi tải menu:", error);
    res.status(500).send("Lỗi khi tải menu.");
  }
};
export const deliveryOrder = async (req, res) => {
  try {
    const { branchId } = req.query; // orderId từ query (nếu có) để thêm món
    const dishes = req.body.dishes; // Dishes từ body
    console.log(branchId);
    // Khởi tạo request cơ sở dữ liệu
    const request = new sql.Request();

    // Lấy giá trị lớn nhất hiện tại của OORDER_ID và DORDER_ID
    const result1 = await request.query(`
      SELECT MAX(OORDER_ID) AS MaxOrderID 
      FROM ONLINE_ORDER
    `);
    const result2 = await request.query(`
      SELECT MAX(DORDER_ID) AS MaxOrderID 
      FROM DELIVERY_ORDER
    `);

    let maxOrderID = result1.recordset[0].MaxOrderID || "O000000"; // Nếu không có giá trị thì bắt đầu từ O000000
    let maxOrderID2 = result2.recordset[0].MaxOrderID || "O000000";

    // Tăng giá trị MaxOrderID lên 1
    const numericPart = parseInt(maxOrderID.substring(1)) + 1;
    const newOrderID = `O${numericPart.toString().padStart(6, "0")}`;

    const numericPart2 = parseInt(maxOrderID2.substring(1)) + 1;
    const newOrderID2 = `O${numericPart2.toString().padStart(6, "0")}`;

    // Lấy ngày và giờ hiện tại
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // Định dạng YYYY-MM-DD
    const time = now.toISOString().split("T")[1].split(".")[0]; // Định dạng HH:MM:SS

    // Cộng thêm 30 phút cho thời gian giao hàng
    const deliveryDateTime = new Date(now);
    deliveryDateTime.setMinutes(deliveryDateTime.getMinutes() + 30);
    const time2 = deliveryDateTime.toISOString().split("T")[1].split(".")[0]; // Định dạng HH:MM:SS
    console.log(time2);
    // Thực hiện các truy vấn để thêm đơn hàng giao hàng
    await request.query(`
      INSERT INTO [ORDER_] (ORDER_ID, ORDER_DATE, BRANCH_ID, CUSTOMER_ID, ORDER_TYPE, ORDER_TIME)
      VALUES ('${newOrderID}', '${date}', '${branchId}', '${req.user.id}', 'DELIVERY', '${time}')
    `);
    await request.query(`
      INSERT INTO DELIVERY_ORDER (DORDER_ID, TIME_DELIVERY, DATE_DELIVERY)
      VALUES ('${newOrderID2}', '${date}', '${time}')
    `);

    // Xử lý các món ăn đặt trước
    const validDishes = Object.values(dishes).filter(dish => dish.quantity > 0);

    if (validDishes.length === 0) {
      return res.redirect("/"); // Nếu không có món nào hợp lệ thì điều hướng về trang chính
    }

    // Sử dụng Promise.all để xử lý nhiều truy vấn
    const insertPromises = validDishes.map(async (dish) => {
      const { id, quantity } = dish;
      const request = new sql.Request();
      request.input("orderId", sql.NVarChar, newOrderID); // Sử dụng newOrderID vừa tạo
      request.input("dishId", sql.Char, id);
      request.input("quantity", sql.Int, quantity);
      return request.query(`
        INSERT INTO ORDER_DISH (ORDER_ID, DISH_ID, QUANTITY)
        VALUES (@orderId, @dishId, @quantity)
      `);
    });

    // Chờ tất cả truy vấn hoàn tất
    await Promise.all(insertPromises);

    // Điều hướng đến trang thành công
    res.redirect("/");
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({
      message: "Lỗi khi xử lý đơn hàng",
      error: error.message,
    });
  }
};
