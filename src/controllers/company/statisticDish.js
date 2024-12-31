// Import necessary modules
import { sql, connect } from "../../database/dbConnection.js"; // Database connection

// Controller to handle the page load and filter action
export const getRevenuePage = async (req, res) => {
  try {
    const pool = await connect();
    console.log("Before database query");
    // Query to get the list of branches
    const branchesResult = await pool
      .request()
      .query(`SELECT BRANCH_ID, BRANCH_NAME FROM RESTAURANT_BRANCH`);
    // Render the page with the branch list
    res.render("company/company_food_revenue", {
      branches: branchesResult.recordset, // Send branches to the view
      message: null, // Optionally send any messages
      revenue: "",
      bestSellingData: "",
      leastSelling: "",
      leastSellingData: "",
      startDate: "",
      endDate: "",
      branchId: "",
      message: "",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller to handle filtering and fetching revenue data
export const getRevenueData = async (req, res) => {
  const { startDate, endDate, branchId } = req.body; // Lấy giá trị từ form gửi lên
  console.log(branchId);
  try {
    const pool = await connect();

    // Truy vấn chi nhánh
    const branchesResult = await pool
      .request()
      .query("SELECT BRANCH_ID, BRANCH_NAME FROM RESTAURANT_BRANCH");

    // Truy vấn doanh thu và món ăn
    const revenueResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .input("branchId", sql.Char(4), branchId).query(`
          SELECT od.DISH_ID, D.DISH_NAME, SUM(od.QUANTITY) AS TOTAL_SALES
          FROM ORDER_DISH od
          JOIN DISH D ON D.DISH_ID = od.DISH_ID
          JOIN ORDER_ O ON O.ORDER_ID = od.ORDER_ID AND O.BRANCH_ID = @branchId
          WHERE O.ORDER_DATE BETWEEN @startDate AND @endDate
          GROUP BY od.DISH_ID, D.DISH_NAME
        `);
    console.log(startDate, endDate);
    const bestSellingResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .input("branchId", sql.Char(4), branchId).query(`
          SELECT TOP 3 od.DISH_ID, D.DISH_NAME, SUM(od.QUANTITY) AS TOTAL_SALES
          FROM ORDER_DISH od
          JOIN DISH D ON D.DISH_ID = od.DISH_ID
          JOIN ORDER_ O ON O.ORDER_ID = od.ORDER_ID AND O.BRANCH_ID = @branchId
          WHERE O.ORDER_DATE BETWEEN @startDate AND @endDate
          GROUP BY od.DISH_ID, D.DISH_NAME
          ORDER BY TOTAL_SALES DESC
        `);

    const leastSellingResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .input("branchId", sql.Char(4), branchId).query(`
          SELECT TOP 3 od.DISH_ID, D.DISH_NAME, SUM(od.QUANTITY) AS TOTAL_SALES
          FROM ORDER_DISH od
          JOIN DISH D ON D.DISH_ID = od.DISH_ID
          JOIN ORDER_ O ON O.ORDER_ID = od.ORDER_ID AND O.BRANCH_ID = @branchId
          WHERE O.ORDER_DATE BETWEEN @startDate AND @endDate
          GROUP BY od.DISH_ID, D.DISH_NAME
          ORDER BY TOTAL_SALES ASC
        `);

    console.log(leastSellingResult.recordset);
    // Render lại trang với dữ liệu doanh thu, chi nhánh, món bán chạy và bán chậm
    res.render("company/company_food_revenue", {
      branches: branchesResult.recordset, // Dữ liệu chi nhánh
      revenue: revenueResult.recordset,
      bestSellingData: bestSellingResult.recordset,
      leastSellingData: leastSellingResult.recordset,
      startDate,
      endDate,
      branchId,
      message: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
