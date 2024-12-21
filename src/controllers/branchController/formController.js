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

    // Kiá»ƒm tra náº¿u recordset tráº£ vá» cĂ³ káº¿t quáº£
    if (result.recordset.length > 0) {
      // Render dá»¯ liá»‡u
      res.render("branch/branch_order_form", {
        branchId: branchId,
        orders: result.recordset,
        user: user,
      });
    } else {
      // Náº¿u khĂ´ng cĂ³ dá»¯ liá»‡u, render trang vá»›i thĂ´ng bĂ¡o khĂ´ng tĂ¬m tháº¥y Ä‘Æ¡n hĂ ng
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
    // Truy váº¥n menu dá»¯ liá»‡u
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

    // Truy váº¥n danh sĂ¡ch bĂ n
    const tablesData = await request.query(`
        SELECT TABLE_NUM, SEAT_AVAILABLE
        FROM TABLE_
        WHERE BRANCH_ID = @branchId AND TABLE_STATUS = N'CĂ²n trá»‘ng'
      `);

    // Xá»­ lĂ½ dá»¯ liá»‡u mĂ³n Äƒn
    const categoriesWithDishes = menuData.recordset.map((row) => ({
      categoryName: row.CATEGORY_NAME,
      dishes: row.DISHES ? JSON.parse(row.DISHES) : [], // Xá»­ lĂ½ náº¿u DISHES null
    }));

    // Kiá»ƒm tra káº¿t quáº£ danh sĂ¡ch bĂ n
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
    // Káº¿t ná»‘i tá»›i SQL Server
    await sql.connect();

    // Láº¥y ORDER_ID lá»›n nháº¥t
    const requestOrderId = new sql.Request();
    const orderResult = await requestOrderId.query(`
        SELECT MAX(ORDER_ID) AS MaxOrderID 
        FROM [ORDER_]
      `);

    let maxOrderID = orderResult.recordset[0].MaxOrderID || "O000000";
    const numericPart = parseInt(maxOrderID.substring(1), 10) + 1;
    const newOrderID = `O${numericPart.toString().padStart(6, "0")}`;

    // Láº¥y thĂ´ng tin CUSTOMER_ID
    const requestCustomer = new sql.Request();
    requestCustomer.input("phoneNumber", sql.VarChar(15), phoneNumber);
    const customerResult = await requestCustomer.query(`
        SELECT CUSTOMER_ID
        FROM CUSTOMER
        WHERE PHONE_NUMBER = @phoneNumber
      `);

    if (customerResult.recordset.length === 0) {
      throw new Error(
        "KhĂ´ng tĂ¬m tháº¥y khĂ¡ch hĂ ng vá»›i sá»‘ Ä‘iá»‡n thoáº¡i nĂ y.",
      );
    }
    const customerId = customerResult.recordset[0].CUSTOMER_ID;

    // NgĂ y vĂ  giá» hiá»‡n táº¡i
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toISOString().split("T")[1].split(".")[0];

    // ChĂ¨n dá»¯ liá»‡u vĂ o báº£ng [ORDER_]
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

    // Xá»­ lĂ½ mĂ³n Äƒn
    if (!dishes || !dishes[0]?.id || !dishes[0]?.quantity) {
      throw new Error("KhĂ´ng cĂ³ mĂ³n Äƒn há»£p lá»‡ Ä‘Æ°á»£c gá»­i.");
    }
    await requestOfflineOrder.query(`
        UPDATE TABLE_
        SET TABLE_STATUS = N'Äang phá»¥c vá»¥'
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
        "KhĂ´ng cĂ³ mĂ³n Äƒn nĂ o Ä‘Æ°á»£c chá»n hoáº·c sá»‘ lÆ°á»£ng khĂ´ng há»£p lá»‡.",
      );
    }

    // ChĂ¨n cĂ¡c mĂ³n Äƒn há»£p lá»‡ vĂ o ORDER_DISH
    const insertPromises = validDishes.map(async (dish) => {
      let { id, quantity } = dish;

      if (id.length < 4) {
        id = id.padEnd(4, " "); // Chuáº©n hĂ³a ID mĂ³n Äƒn
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

    // Chá» táº¥t cáº£ cĂ¡c truy váº¥n hoĂ n táº¥t
    await Promise.all(insertPromises);

    // Äiá»u hÆ°á»›ng tá»›i trang thĂ nh cĂ´ng
    res.redirect(`/branch/${branchId}/order-form`);
  } catch (error) {
    console.error("Error creating offline order:", error);
    res.status(500).json({
      error: "Lá»—i khi táº¡o Ä‘Æ¡n hĂ ng offline",
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
    // Truy váº¥n menu dá»¯ liá»‡u
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

    // Truy vấn bàn trống
    const tablesData = await request.query(`
        SELECT TABLE_NUM, SEAT_AVAILABLE
        FROM TABLE_
        WHERE BRANCH_ID = @branchId AND TABLE_STATUS = N'CĂ²n trá»‘ng'
      `);
    const tables = tablesData.recordset;

    // Truy váº¥n bĂ n hiá»‡n táº¡i cá»§a order náº¿u lĂ  Offline hoáº·c Online
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
      dishes: row.DISHES ? JSON.parse(row.DISHES) : [], // Xá»­ lĂ½ náº¿u DISHES null
    }));

    // Render giao diá»‡n
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
  const request = new sql.Request();

  try {

    for (let i = 0; i < dishes[0].id.length; i++) {
      const dishId = dishes[0].id[i]; // Láº¥y id mĂ³n Äƒn
      const quantity = parseInt(dishes[0].quantity[i], 10); 
      if (quantity === 0) {
 
        await request
          .input(`orderId${dishId}`, sql.Char(7), orderId) 
          .input(`dishId${dishId}`, sql.Char(4), dishId)
          .query(
            `DELETE FROM order_dish WHERE ORDER_ID = @orderId${dishId} AND DISH_ID = @dishId${dishId}`,
          );
      } else {
    
        const dish = await request
          .input(`orderId${dishId}`, sql.Char(7), orderId) 
          .input(`dishId${dishId}`, sql.Char(4), dishId)
          .query(
            `SELECT * FROM order_dish WHERE ORDER_ID = @orderId${dishId} AND DISH_ID = @dishId${dishId}`,
          );
        if (dish.recordset.length > 0) {

          await request
            .input(`quantity${dishId}`, sql.Int, quantity)
            .query(
              `UPDATE order_dish SET QUANTITY = @quantity${dishId} WHERE ORDER_ID = @orderId${dishId} AND DISH_ID = @dishId${dishId}`,
            );
        } else {
      
          await request
            .input(`quantity${dishId}`, sql.Int, quantity)
            .query(
              `INSERT INTO order_dish (ORDER_ID, DISH_ID, QUANTITY) VALUES (@orderId${dishId}, @dishId${dishId}, @quantity${dishId})`,
            );
        }
      }
    }

    // Cập nhật TABLE_NUMBER trong ONLINE_ORDER hoặc OFFLINE_ORDER
    if (orderType === "Online") {
      await request
        .input("orderId", sql.Char(7), orderId)
        .input("tableNum", sql.Int, tableNum)
        .query(
          `UPDATE ONLINE_ORDER 
           SET TABLE_NUMBER = @tableNum 
           WHERE OORDER_ID = @orderId`,
        );

      // Cáº­p nháº­t tráº¡ng thĂ¡i trong báº£ng TABLE_
      await request.input("tableNum1", sql.Int, tableNum).query(
        `UPDATE TABLE_ 
           SET TABLE_STATUS = 'Äang phá»¥c vá»¥' 
           WHERE TABLE_NUM = @tableNum1`,
      );
    } else if (orderType === "Offline") {
      await request
        .input("orderId", sql.Char(7), orderId)
        .input("tableNum", sql.Int, tableNum)
        .query(
          `UPDATE OFFLINE_ORDER 
           SET TABLE_NUMBER = @tableNum
           WHERE OFORDER_ID = @orderId`,
        );

      // Cáº­p nháº­t tráº¡ng thĂ¡i trong báº£ng TABLE_
      await request
        .input("branchId", sql.Char(7), branchId)
        .input("tableNum1", sql.Int, tableNum)
        .query(
          `UPDATE TABLE_ 
           SET TABLE_STATUS = 'Äang phá»¥c vá»¥' 
           WHERE TABLE_NUM = @tableNum1 AND BRANCH_ID = @branchId`,
        );
    }

    // Sau khi xử lý xong, chuyển hướng người dùng hoặc gửi phản hồi
    res.redirect(`/branch/${branchId}/order-form`);
  } catch (error) {
    console.error("Error updating order:", error);
    res
      .status(500)
      .send("CĂ³ lá»—i xáº£y ra khi cáº­p nháº­t phiáº¿u Ä‘áº·t mĂ³n.");
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

    // Thá»±c thi thá»§ tá»¥c
    await request.execute("payOrder");

    // Tính `RATING_ID` mới
    const result = await request.query(`
      SELECT TOP 1 RATING_ID 
      FROM BRANCH_RATING 
      ORDER BY RATING_ID DESC
    `);
    const lastRatingId = result.recordset[0]?.RATING_ID || "R000000"; // Náº¿u báº£ng rá»—ng, báº¯t Ä‘áº§u tá»« R000000
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
      // Láº¥y `INVOICE_ID` tá»« báº£ng INVOICE
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
    // Xá»­ lĂ½ lá»—i
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
