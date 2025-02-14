import { sql } from "../../database/dbConnection.js";

export const branchFormController = async (req, res) => {
  const { branchId } = req.params;
  const pageNum = parseInt(req.query.pageNum, 10) || 1; // Trang hiện tại, mặc định là trang 1
  const pageSize = 30; // Số bản ghi trên mỗi trang
  const user = req.user;
  const request = new sql.Request();

  request.input("branchId", sql.Char(4), branchId);

  try {
    const result = await request.execute(`getOrdersByBranch`);
    const orders = result.recordset;
    const totalRecords = orders.length; // Tổng số bản ghi
    const totalPages = Math.ceil(totalRecords / pageSize);

    const paginatedOrders = orders.slice(
      (pageNum - 1) * pageSize,
      pageNum * pageSize,
    );
    if (result.recordset.length > 0) {
      res.render("branch/branch_order_form", {
        branchId: branchId,
        orders: paginatedOrders,
        user: user,
        currentPage: pageNum,
        totalPages: totalPages,
      });
    } else {
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
    const menuData = await request.execute(`getMenuByBranch`);

    const tablesData = await request.query(`
        SELECT TABLE_NUM, SEAT_AVAILABLE
        FROM TABLE_
        WHERE BRANCH_ID = @branchId AND TABLE_STATUS = N'Còn trống'
      `);

    const categoriesWithDishes = menuData.recordset.map((row) => ({
      categoryName: row.CATEGORY_NAME,
      dishes: row.DISHES ? JSON.parse(row.DISHES) : [],
    }));

    const tables = tablesData.recordset;
    if (!tables || tables.length === 0) {
      console.warn("No tables found for branch:", branchId);
    }
    // Render giao diá»‡n
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
    await sql.connect();

    const requestOrderId = new sql.Request();
    const orderResult = await requestOrderId.query(`
        SELECT MAX(ORDER_ID) AS MaxOrderID 
        FROM [ORDER_]
      `);

    let maxOrderID = orderResult.recordset[0].MaxOrderID || "O000000";
    const numericPart = parseInt(maxOrderID.substring(1), 10) + 1;
    const newOrderID = `O${numericPart.toString().padStart(6, "0")}`;

    const requestCustomer = new sql.Request();
    requestCustomer.input("phoneNumber", sql.VarChar(15), phoneNumber);
    const customerResult = await requestCustomer.query(`
        SELECT CUSTOMER_ID
        FROM CUSTOMER
        WHERE PHONE_NUMBER = @phoneNumber
      `);

    if (customerResult.recordset.length === 0) {
      throw new Error("Không tìm thấy khách hàng nào.");
    }
    const customerId = customerResult.recordset[0].CUSTOMER_ID;

    const now = new Date();
    const time = now.toISOString().split("T")[1].split(".")[0];
    now.setHours(now.getHours() + 7);
    const date = now.toISOString().split("T")[0];

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

    if (!dishes || !dishes[0]?.id || !dishes[0]?.quantity) {
      throw new Error("Không có món ăn.");
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
      throw new Error("Lỗi tìm validDishes");
    }

    const insertPromises = validDishes.map(async (dish) => {
      let { id, quantity } = dish;

      if (id.length < 4) {
        id = id.padEnd(4, " ");
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

    await Promise.all(insertPromises);

    res.redirect(`/branch/${branchId}/order-form`);
  } catch (error) {
    console.error("Error creating offline order:", error);
    res.status(500).json({
      error: "Lỗi khi tạo offline order",
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
    const menuData = await request.execute(`getOrderDishForUpdate`);

    // Truy vấn bàn trống
    const tablesData = await request.query(`
        SELECT TABLE_NUM, SEAT_AVAILABLE
        FROM TABLE_
        WHERE BRANCH_ID = @branchId AND TABLE_STATUS = N'Còn trống'
      `);
    const tables = tablesData.recordset;

    let currentTable = null;
    if (orderType === "Offline") {
      const currentTableData = await request.query(`
          SELECT T.TABLE_NUM, T.SEAT_AVAILABLE
          FROM TABLE_ T
          JOIN OFFLINE_ORDER O ON O.TABLE_NUMBER = T.TABLE_NUM
          WHERE O.OFORDER_ID = @orderId
        `);
      currentTable =
        currentTableData.recordset.length > 0
          ? currentTableData.recordset[0]
          : null;
    } else if (orderType === "Online") {
      const currentTableData = await request.query(`
          SELECT T.TABLE_NUM, T.SEAT_AVAILABLE
          FROM TABLE_ T
          JOIN ONLINE_ORDER O ON O.TABLE_NUMBER = T.TABLE_NUM
          WHERE O.OORDER_ID = @orderId
        `);
      currentTable =
        currentTableData.recordset.length > 0
          ? currentTableData.recordset[0]
          : null;
    }
    // Xử lý dữ liệu món ăn
    const categoriesWithDishes = menuData.recordset.map((row) => ({
      categoryName: row.CATEGORY_NAME,
      dishes: row.DISHES ? JSON.parse(row.DISHES) : [], 
    }));

    res.render("branch/update_order", {
      user,
      branchId,
      categoriesWithDishes,
      orderId,
      orderType,
      orderDate,
      orderTime,
      tables,
      currentTable,
    });
  } catch (error) {
    console.error("Error fetching update order data:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const updateOrderForm = async (req, res) => {
  const branchId = req.params.branchId; // Lấy branchId từ URL
  const { orderId, tableNum, orderType } = req.body; // Lấy orderId, tableNum, orderType từ form
  const dishes = req.body.dishes || { id: [], quantity: [] }; // Đảm bảo có giá trị mặc định cho dishes

  try {
    // Cập nhật thông tin các món ăn trong order
    for (let i = 0; i < dishes[0].id.length; i++) {
      const dishId = dishes[0].id[i];
      const quantity = parseInt(dishes[0].quantity[i], 10);

      // Tạo request mới cho mỗi món ăn
      const dishRequest = new sql.Request();
      await dishRequest
        .input("orderId", sql.Char(7), orderId)
        .input("dishId", sql.Char(4), dishId)
        .input("quantity", sql.Int, quantity)
        .execute("UpdateOrderDish");
    }

    // Cập nhật TABLE_NUMBER và trạng thái bàn
    const tableRequest = new sql.Request();
    await tableRequest
      .input("orderId", sql.Char(7), orderId)
      .input("tableNum", sql.Int, tableNum)
      .input("branchId", sql.Char(4), branchId)
      .input("orderType", sql.NVarChar(10), orderType)
      .execute("UpdateTableAndOrder");

    // Sau khi xử lý xong, chuyển hướng người dùng hoặc gửi phản hồi
    res.redirect(`/branch/${branchId}/order-form`);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).send("Có lỗi khi cập nhật order");
  }
};



export const branchRatingControlller = async (req, res) => {
  const { branchId } = req.params;
  const { orderId, orderType } = req.query;
  res.render("branch/branch_rating", { branchId, orderId, orderType });
};

export const payOrderForm = async (req, res) => {
  const branchId = req.params.branchId;
  const {
    orderId,
    orderType,
    service_rating,
    location_rating,
    price_rating,
    food_quality_rating,
    environment_rating,
    staff_rating,
    comment,
  } = req.body;

  try {
    const request = new sql.Request();

    // Thêm các input cho thủ tục
    request.input("OrderId", sql.Char(7), orderId);
    request.input("BranchId", sql.Char(7), branchId);
    request.input("OrderType", sql.NVarChar, orderType);
    request.input("StaffRating", sql.Int, staff_rating || 0);

    await request.execute("payOrder");

    // Tính `RATING_ID` mới
    const result = await request.query(`
      SELECT TOP 1 RATING_ID 
      FROM BRANCH_RATING 
      ORDER BY RATING_ID DESC
    `);
    const lastRatingId = result.recordset[0]?.RATING_ID || "R000000";
    const newRatingId = `R${String(Number(lastRatingId.slice(1)) + 1).padStart(6, "0")}`;

    // ThĂªm cĂ¡c input cho Ä‘Ă¡nh giĂ¡
    request.input("ServiceRating", sql.Int, service_rating || 0);
    request.input("LocationRating", sql.Int, location_rating || 0);
    request.input("PriceRating", sql.Int, price_rating || 0);
    request.input("FoodQualityRating", sql.Int, food_quality_rating || 0);
    request.input("EnvironmentRating", sql.Int, environment_rating || 0);
    request.input("Comment", sql.NVarChar, comment || "");
    request.input("RatingId", sql.Char(7), newRatingId);

    if (orderType === "Offline") {
      const invoiceQuery = await request.query(`
        SELECT INVOICE_ID 
        FROM INVOICE 
        WHERE ORDER_ID = @OrderId
      `);
      const invoiceId = invoiceQuery.recordset[0]?.INVOICE_ID || null;

      if (invoiceId) {
        request.input("InvoiceId", sql.Char(10), invoiceId);
        await request.query(`
          INSERT INTO BRANCH_RATING (
            RATING_ID, SERVICE_RATING, LOCATION_RATING, PRICE_RATING, 
            DISH_QUALITY_RATING, ENVIRONMENT_RATING, COMMENTS, BRANCH_ID, 
            RATING_DATE, INVOICE_ID
          )
          VALUES (
            @RatingId, @ServiceRating, @LocationRating, @PriceRating, 
            @FoodQualityRating, @EnvironmentRating, @Comment, @BranchId, 
            GETDATE(), @InvoiceId
          )
        `);
      }
    }

    // Điều hướng lại sau khi thanh toán
    res.redirect(`/branch/${branchId}/order-form`);
  } catch (error) {
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
