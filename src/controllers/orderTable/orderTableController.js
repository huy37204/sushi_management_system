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
      membershipCard: req.session.membershipCard || null,
    });
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu danh sách chi nhánh hoặc menu:", err);
    res.status(500).send("Đã xảy ra lỗi khi xử lý yêu cầu.");
  }
};

export const createTableBooking = async (req, res) => {
  try {
    const { quantity, branch } = req.body;
    const customerId = req.user.id;

    // Lấy kết nối cơ sở dữ liệu
    const request = new sql.Request();

    const result = await request
      .input("quantity", sql.Int, quantity)
      .input("branchId", sql.NVarChar, branch)
      .input("customerId", sql.NVarChar, customerId)
      .execute("createTableBooking");
    // Lấy giá trị lớn nhất hiện tại của ORDER_ID

    const { newOrderID } = result.recordset[0];
    // Phản hồi thành công
    res.redirect(
      `/table-booking/pre-order?orderId=${newOrderID}&branchId=${branch}`,
    );
  } catch (error) {
    console.error(error);
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
    const menuData = await request.execute("getDishesByCategory");

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
      membershipCard: req.session.membershipCard || null,
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
