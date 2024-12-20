import { sql } from "../../database/dbConnection.js";

export const branchFormController = async (req, res) => {
  const { branchId } = req.params;
  const user = req.user;
  const request = new sql.Request();

  request.input("branchId", sql.Char(4), branchId);

  try {
    const result = await request.query(`
        SELECT 
            O.ORDER_ID, 
            O.ORDER_DATE, 
            O.ORDER_TYPE, 
            O.ORDER_TIME,
            CASE 
                WHEN I.ORDER_ID IS NOT NULL THEN N'Đã thanh toán'
                ELSE N'Chưa thanh toán'
            END AS STATUS
        FROM 
            [ORDER_] O
        LEFT JOIN 
            [INVOICE] I ON O.ORDER_ID = I.ORDER_ID
        WHERE 
            O.BRANCH_ID = @branchId
        ORDER BY 
            O.ORDER_TYPE;
    `);

    // Kiểm tra nếu recordset trả về có kết quả
    if (result.recordset.length > 0) {
      // Render dữ liệu
      res.render("branch/branch_order_form", {
        branchId: branchId,
        orders: result.recordset,
        user: user,
      });
    } else {
      // Nếu không có dữ liệu, render trang với thông báo không tìm thấy đơn hàng
      res.render("branch/branch_order_form", {
        branchId,
        orders: [],
        user,
      });
    }
  } catch (error) {
    console.error("Error fetching branch form details:", error);
    res.status(500).send("Internal server error.");
  }
};

export const offlineOrderController = async (req, res) => {
  const { branchId } = req.params;
  const user = req.user;

  const request = new sql.Request();
  request.input("branchId", sql.Char(4), branchId);

  try {
    // Truy vấn menu dữ liệu
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
                    DISH_AVAILABLE DA ON DA.BRANCH_ID = @branchId 
                    AND DA.DISH_ID = D.DISH_ID 
                    AND DA.IS_AVAILABLE = 1
                WHERE 
                    D.CATEGORY_NAME = MC.CATEGORY_NAME
                FOR JSON PATH
            ) AS DISHES
        FROM 
            (SELECT DISTINCT CATEGORY_NAME FROM DISH) MC
        ORDER BY 
            MC.CATEGORY_NAME;
      `);

    // Truy vấn danh sách bàn
    const tablesData = await request.query(`
        SELECT TABLE_NUM, SEAT_AVAILABLE
        FROM TABLE_
        WHERE BRANCH_ID = @branchId AND TABLE_STATUS = N'Còn trống'
      `);

    // Xử lý dữ liệu món ăn
    const categoriesWithDishes = menuData.recordset.map((row) => ({
      categoryName: row.CATEGORY_NAME,
      dishes: row.DISHES ? JSON.parse(row.DISHES) : [], // Xử lý nếu DISHES null
    }));

    // Kiểm tra kết quả danh sách bàn
    const tables = tablesData.recordset;
    if (!tables || tables.length === 0) {
      console.warn("No tables found for branch:", branchId);
    }
    // Render giao diện
    res.render("branch/offline_order", {
      user,
      branchId,
      categoriesWithDishes,
      tables,
    });
  } catch (error) {
    console.error("Error fetching offline order data:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const createOfflineOrder = async (req, res) => {
  const { branchId } = req.params;
  const { phoneNumber, tableNum, dishes } = req.body;
  const user = req.user;

  try {
    // Kết nối tới SQL Server
    await sql.connect();

    // Lấy ORDER_ID lớn nhất
    const requestOrderId = new sql.Request();
    const orderResult = await requestOrderId.query(`
        SELECT MAX(ORDER_ID) AS MaxOrderID 
        FROM [ORDER_]
      `);

    let maxOrderID = orderResult.recordset[0].MaxOrderID || "O000000";
    const numericPart = parseInt(maxOrderID.substring(1), 10) + 1;
    const newOrderID = `O${numericPart.toString().padStart(6, "0")}`;

    // Lấy thông tin CUSTOMER_ID
    const requestCustomer = new sql.Request();
    requestCustomer.input("phoneNumber", sql.VarChar(15), phoneNumber);
    const customerResult = await requestCustomer.query(`
        SELECT CUSTOMER_ID
        FROM CUSTOMER
        WHERE PHONE_NUMBER = @phoneNumber
      `);

    if (customerResult.recordset.length === 0) {
      throw new Error("Không tìm thấy khách hàng với số điện thoại này.");
    }
    const customerId = customerResult.recordset[0].CUSTOMER_ID;

    // Ngày và giờ hiện tại
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toISOString().split("T")[1].split(".")[0];

    // Chèn dữ liệu vào bảng [ORDER_]
    const requestOrder = new sql.Request();
    requestOrder.input("orderId", sql.Char(7), newOrderID);
    requestOrder.input("orderDate", sql.Date, date);
    requestOrder.input("branchId", sql.Char(4), branchId);
    requestOrder.input("customerId", sql.Char(7), customerId);
    requestOrder.input("orderType", sql.VarChar(15), "Offline");
    requestOrder.input("tableNum", sql.Int, tableNum);
    requestOrder.input("employeeId", sql.Char(7), user.id);

    await requestOrder.query(`
        INSERT INTO [ORDER_] (ORDER_ID, ORDER_DATE, ORDER_TIME, BRANCH_ID, CUSTOMER_ID, ORDER_TYPE)
        VALUES (@orderId, @orderDate, '${time}', @branchId, @customerId, @orderType)
      `);

    const requestOfflineOrder = new sql.Request();
    requestOfflineOrder.input("orderId", sql.Char(7), newOrderID);
    requestOfflineOrder.input("tableNum", sql.Int, tableNum);
    requestOfflineOrder.input("employeeId", sql.Char(7), user.id);
    requestOfflineOrder.input("branchId", sql.Char(4), branchId);

    await requestOfflineOrder.query(`
        INSERT INTO [OFFLINE_ORDER] (OFORDER_ID, TABLE_NUMBER, EMPLOYEE_ID, BRANCH_ID)
        VALUES (@orderId, @tableNum, @employeeId, @branchId)
      `);

    // Xử lý món ăn
    if (!dishes || !dishes[0]?.id || !dishes[0]?.quantity) {
      throw new Error("Không có món ăn hợp lệ được gửi.");
    }
    await requestOfflineOrder.query(`
        UPDATE TABLE_
        SET TABLE_STATUS = N'Đang phục vụ'
        WHERE TABLE_NUM = @tableNum AND BRANCH_ID = @branchId
        `);

    const validDishes = [];
    for (let i = 0; i < dishes[0].id.length; i++) {
      const id = dishes[0].id[i];
      const quantity = parseInt(dishes[0].quantity[i], 10);

      if (quantity > 0) {
        validDishes.push({ id, quantity });
      }
    }

    if (validDishes.length === 0) {
      throw new Error(
        "Không có món ăn nào được chọn hoặc số lượng không hợp lệ.",
      );
    }

    // Chèn các món ăn hợp lệ vào ORDER_DISH
    const insertPromises = validDishes.map(async (dish) => {
      let { id, quantity } = dish;

      if (id.length < 4) {
        id = id.padEnd(4, " "); // Chuẩn hóa ID món ăn
      } else if (id.length > 4) {
        id = id.substring(0, 4);
      }

      const requestDish = new sql.Request();
      requestDish.input("orderId", sql.NVarChar, newOrderID);
      requestDish.input("dishId", sql.Char(4), id);
      requestDish.input("quantity", sql.Int, quantity);

      return requestDish.query(`
          INSERT INTO ORDER_DISH (ORDER_ID, DISH_ID, QUANTITY)
          VALUES (@orderId, @dishId, @quantity)
        `);
    });

    // Chờ tất cả các truy vấn hoàn tất
    await Promise.all(insertPromises);

    // Điều hướng tới trang thành công
    res.redirect(`/branch/${branchId}/order-form`);
  } catch (error) {
    console.error("Error creating offline order:", error);
    res.status(500).json({
      error: "Lỗi khi tạo đơn hàng offline",
      message: error.message,
    });
  }
};

export const updateOrderController = async (req, res) => {
  const { branchId } = req.params;
  const user = req.user;
  const { orderId, orderType, orderDate, orderTime } = req.query;

  const request = new sql.Request();
  request.input("branchId", sql.Char(4), branchId);
  request.input("orderId", sql.Char(7), orderId);

  try {
    // Truy vấn menu dữ liệu
    const menuData = await request.query(`
        SELECT 
          MC.CATEGORY_NAME,
          (
            SELECT 
              D.DISH_ID,
              D.DISH_NAME,
              D.DISH_PRICE,
              ISNULL(OD.QUANTITY, 0) AS QUANTITY
            FROM 
              DISH D
            LEFT JOIN 
              DISH_AVAILABLE DA 
              ON DA.BRANCH_ID = @branchId 
              AND DA.DISH_ID = D.DISH_ID 
              AND DA.IS_AVAILABLE = 1
            LEFT JOIN 
              ORDER_DISH OD 
              ON OD.DISH_ID = D.DISH_ID 
              AND OD.ORDER_ID = @orderId
            WHERE 
              D.CATEGORY_NAME = MC.CATEGORY_NAME
            FOR JSON PATH
          ) AS DISHES
        FROM 
          (SELECT DISTINCT CATEGORY_NAME FROM DISH) MC
        ORDER BY 
          MC.CATEGORY_NAME;
      `);

    // Xử lý dữ liệu món ăn
    const categoriesWithDishes = menuData.recordset.map((row) => ({
      categoryName: row.CATEGORY_NAME,
      dishes: row.DISHES ? JSON.parse(row.DISHES) : [], // Xử lý nếu DISHES null
    }));

    // Render giao diện
    res.render("branch/update_order", {
      user,
      branchId,
      categoriesWithDishes,
      orderId,
      orderType,
      orderDate,
      orderTime,
    });
  } catch (error) {
    console.error("Error fetching update order data:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const updateOrderForm = async (req, res) => {
  const branchId = req.params.branchId; // Lấy branchId từ URL
  const orderId = req.body.orderId; // Lấy orderId từ form
  const dishes = req.body.dishes || { id: [], quantity: [] }; // Đảm bảo có giá trị mặc định cho dishes
  const request = new sql.Request();

  try {
    // Lặp qua mảng id và quantity
    for (let i = 0; i < dishes[0].id.length; i++) {
      const dishId = dishes[0].id[i]; // Lấy id món ăn
      const quantity = parseInt(dishes[0].quantity[i], 10); // Lấy số lượng món ăn, chuyển thành số nguyên
      if (quantity === 0) {
        // Nếu số lượng = 0, xóa món khỏi bảng order_dish
        await request
          .input(`orderId${dishId}`, sql.Char(7), orderId) // Đổi tên tham số
          .input(`dishId${dishId}`, sql.Char(4), dishId)
          .query(
            `DELETE FROM order_dish WHERE ORDER_ID = @orderId${dishId} AND DISH_ID = @dishId${dishId}`,
          );
      } else {
        // Kiểm tra xem món ăn đã tồn tại trong order_dish chưa
        const dish = await request
          .input(`orderId${dishId}`, sql.Char(7), orderId) // Đổi tên tham số
          .input(`dishId${dishId}`, sql.Char(4), dishId)
          .query(
            `SELECT * FROM order_dish WHERE ORDER_ID = @orderId${dishId} AND DISH_ID = @dishId${dishId}`,
          );
        if (dish.recordset.length > 0) {
          // Nếu đã tồn tại, cập nhật số lượng
          await request
            .input(`quantity${dishId}`, sql.Int, quantity)
            .query(
              `UPDATE order_dish SET QUANTITY = @quantity${dishId} WHERE ORDER_ID = @orderId${dishId} AND DISH_ID = @dishId${dishId}`,
            );
        } else {
          // Nếu chưa tồn tại, thêm mới món ăn
          await request
            .input(`quantity${dishId}`, sql.Int, quantity)
            .query(
              `INSERT INTO order_dish (ORDER_ID, DISH_ID, QUANTITY) VALUES (@orderId${dishId}, @dishId${dishId}, @quantity${dishId})`,
            );
        }
      }
    }

    // Sau khi xử lý xong, chuyển hướng người dùng hoặc gửi phản hồi
    res.redirect(`/branch/${branchId}/order-form`);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).send("Có lỗi xảy ra khi cập nhật phiếu đặt món.");
  }
};

export const payOrderForm = async (req, res) => {
  const branchId = req.params.branchId;
  const orderId = req.body.orderId;

  try {
    const request = new sql.Request();

    // Thêm input cho thủ tục payOrder
    request.input("OrderId", sql.Char(7), orderId); // Sửa: cần đặt "OrderId" trong dấu ngoặc kép

    // Thực thi thủ tục
    await request.execute("payOrder");

    res.redirect(`/branch/${branchId}/order-form`);
  } catch (error) {
    // Xử lý lỗi
    console.error("Error executing payOrder:", error);
    res.status(500).send("Error processing the request.");
  }
};

export const deleteOrderForm = async (req, res) => {
  const branchId = req.params.branchId;
  const { orderId, orderType } = req.body;

  try {
    const request = new sql.Request();

    request.input("ORDER_ID", sql.Char(7), orderId);
    request.input("ORDER_TYPE", sql.NVarChar, orderType);
    request.input("BRANCH_ID", sql.Char(4), branchId);

    await request.execute("deleteOrder");

    res.redirect(`/branch/${branchId}/order-form`);
  } catch (error) {
    console.error("Error executing deleteOrder:", error);
    res.status(500).send("Error processing the delete order request.");
  }
};
