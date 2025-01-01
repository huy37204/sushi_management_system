// Import necessary modules
import { sql, connect } from "../../database/dbConnection.js"; // Database connection

// Controller to handle the page load and filter action
export const getRevenuePage = async (req, res) => {
  try {
    const pool = await connect();
    console.log("Before database query");

    // Call the GetBranches stored procedure
    const branchesResult = await pool.request().execute("GetBranches");

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
    console.error("Error fetching revenue page:", error);
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
    const branchesResult = await pool.request().execute("GetBranches");

    // Truy vấn doanh thu
    const revenueResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .input("branchId", sql.Char(4), branchId)
      .execute("GetRevenueData");

    // Truy vấn món bán chạy
    const bestSellingResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .input("branchId", sql.Char(4), branchId)
      .execute("GetBestSellingDishes");

    // Truy vấn món bán chậm
    const leastSellingResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .input("branchId", sql.Char(4), branchId)
      .execute("GetLeastSellingDishes");

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
