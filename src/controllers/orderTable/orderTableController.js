import { sql } from "../../database/dbConnection.js";
import { getMenuDropDownItem } from "../menuController/menuDropdownController.js";

export const orderTableController = async (req, res) => {
  try {
    // Tạo một request mới từ kết nối SQL
    const request = new sql.Request();

    // Sử dụng Promise.all để xử lý đồng thời hai tác vụ
    const [branchList, menuDropDownData] = await Promise.all([
      request.query("SELECT BRANCH_ID, BRANCH_NAME FROM RESTAURANT_BRANCH"),
      getMenuDropDownItem(),
    ]);

    // Render view và truyền dữ liệu
    res.render("customer/table_booking", {
      activePage: "table-booking",
      user: req.user || null,
      menuDropDownData,
      branchList: branchList.recordset, // Lấy danh sách chi nhánh từ kết quả query
    });
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu danh sách chi nhánh hoặc menu:", err);
    res.status(500).send("Đã xảy ra lỗi khi xử lý yêu cầu.");
  }
};

export const createTableBooking = async (req, res) => {
  try {
    const { quantity, branch } = req.body;

    // Lấy kết nối cơ sở dữ liệu
    const request = new sql.Request();

    // Bắt đầu giao dịch để tránh xung đột trong môi trường nhiều yêu cầu đồng thời
    const transaction = new sql.Transaction();
    await transaction.begin();

    // Lấy giá trị lớn nhất hiện tại của ORDER_ID
    const result = await transaction.request().query(`
      SELECT MAX(ORDER_ID) AS MaxOrderID 
      FROM [ORDER_]
    `);

    // Xử lý giá trị của MaxOrderID
    let maxOrderID = result.recordset[0].MaxOrderID || "O000000"; // Nếu không có giá trị thì bắt đầu từ O0000000
    const numericPart = parseInt(maxOrderID.substring(1)) + 1; // Tăng phần số lên 1
    const newOrderID = `O${numericPart.toString().padStart(6, "0")}`; // Tạo ORDER_ID mới

    // Lấy ngày và giờ hiện tại
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // Định dạng YYYY-MM-DD
    const time = now.toISOString().split("T")[1].split(".")[0]; // Định dạng HH:MM:SS

    // Chèn dữ liệu vào bảng [ORDER_]
    await transaction.request().query(`
      INSERT INTO [ORDER_] (ORDER_ID, ORDER_DATE, BRANCH_ID, CUSTOMER_ID, ORDER_TYPE, ORDER_TIME)
      VALUES ('${newOrderID}', '${date}', '${branch}', '${req.user.id}', 'Online', '${time}')
    `);

    // Chèn dữ liệu vào bảng ONLINE_ORDER
    await transaction.request().query(`
      INSERT INTO ONLINE_ORDER (OORDER_ID, CUSTOMER_QUANTITY, BRANCH_ID, ARRIVAL_DATE, ARRIVAL_TIME)
      VALUES ('${newOrderID}', ${quantity}, '${branch}', '${date}', '${time}')
    `);

    // Cam kết giao dịch
    await transaction.commit();

    // Phản hồi thành công
    res.redirect(
      `/table-booking/pre-order?orderId=${newOrderID}&branchId=${branch}`,
    );
  } catch (error) {
    console.error(error);

    // Rút lại giao dịch nếu có lỗi
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({
      message: "Error creating order",
      error: error.message,
    });
  }
};

export const preorderController = async (req, res) => {
  try {
    const { orderId, branchId } = req.query;
    const request = new sql.Request();

    request.input("branchId", sql.VarChar, branchId);

    // Lấy dữ liệu menu đã nhóm theo CATEGORY_NAME
    const menuData = await request.query(`
            SELECT 
                MC.CATEGORY_NAME,
                (
                    SELECT 
                        D.DISH_ID,
                        D.DISH_NAME,
                        D.DISH_PRICE
                    FROM 
                        DISH D
                    JOIN 
                        DISH_AVAILABLE DA ON DA.BRANCH_ID = @branchId AND DA.DISH_ID = D.DISH_ID AND DA.IS_AVAILABLE = 1
                    WHERE 
                        D.CATEGORY_NAME = MC.CATEGORY_NAME
                    FOR JSON PATH
                ) AS DISHES
            FROM 
                (SELECT DISTINCT CATEGORY_NAME FROM DISH) MC
            ORDER BY 
                MC.CATEGORY_NAME;
        `);

    // Chuyển dữ liệu JSON trả về thành cấu trúc mảng
    const categoriesWithDishes = menuData.recordset.map((row) => ({
      categoryName: row.CATEGORY_NAME,
      dishes: JSON.parse(row.DISHES),
    }));

    // Lấy dữ liệu cho menu drop-down (nếu cần thiết)
    const menuDropDownData = await getMenuDropDownItem();

    res.render("customer/order_menu", {
      activePage: "table-booking-preorder",
      user: req.user || null,
      categoriesWithDishes,
      menuDropDownData,
      orderId,
      branchId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Lỗi khi tìm món ăn đặt trước",
      error: error.message,
    });
  }
};

export const addDishPreorder = async (req, res) => {
  try {
    const { orderId, branchId } = req.query;
    const dishes = req.body.dishes; // Dữ liệu nhận từ req.body.dishes

    const validDishes = [];

    // Duyệt qua các món ăn và kết hợp id với quantity
    for (let i = 0; i < dishes[0].id.length; i++) {
      const id = dishes[0].id[i];
      const quantity = parseInt(dishes[0].quantity[i], 10);

      if (quantity >= 1) {
        validDishes.push({ id, quantity });
      }
    }
    console.log(validDishes);
    // Nếu không có món ăn hợp lệ, trả về trang chủ
    if (validDishes.length === 0) {
      return res.redirect("/");
    }

    // Chèn các món ăn hợp lệ vào cơ sở dữ liệu
    const insertPromises = validDishes.map(async (dish) => {
      let { id, quantity } = dish;

      // Đảm bảo id có độ dài đúng là 4 ký tự
      if (id.length < 4) {
        id = id.padEnd(4, " "); // Điền thêm khoảng trắng nếu id ngắn hơn 4 ký tự
      } else if (id.length > 4) {
        id = id.substring(0, 4); // Cắt bớt nếu id dài hơn 4 ký tự
      }

      const request = new sql.Request();
      request.input("orderId", sql.NVarChar, orderId);
      request.input("dishId", sql.Char(4), id); // Dùng Char(4) cho id
      request.input("quantity", sql.Int, quantity);

      return request.query(`
          INSERT INTO ORDER_DISH (ORDER_ID, DISH_ID, QUANTITY)
          VALUES (@orderId, @dishId, @quantity)
        `);
    });

    // Chờ tất cả các truy vấn hoàn tất
    await Promise.all(insertPromises);

    // Điều hướng đến trang thành công
    res.redirect("/");
  } catch (error) {
    console.error("Error adding dishes to preorder:", error);
    res.status(500).json({
      message: "Lỗi khi đặt trước món ăn",
      error: error.message,
    });
  }
};
