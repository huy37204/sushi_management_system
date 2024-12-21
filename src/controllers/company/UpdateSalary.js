// Import the necessary modules
import { sql, connect } from "../../database/dbConnection.js"; // Database connection

// Hàm lấy danh sách chi nhánh và lương theo chi nhánh (nếu có)
export const getSalaries = async (req, res) => {
  const { branchId } = req.body; // Lấy branchId từ body vì đã chuyển sang POST

  try {
    const pool = await connect();

    // Lấy danh sách các chi nhánh
    const branchesResult = await pool
      .request()
      .query(`SELECT BRANCH_ID, BRANCH_NAME FROM RESTAURANT_BRANCH`);

    // Khởi tạo danh sách lương
    let salaries = [];

    // Nếu có branchId, lấy dữ liệu lương theo chi nhánh
    if (branchId) {
      const salariesResult = await pool
        .request()
        .input("branchId", sql.Char(4), branchId) // Sửa kiểu thành CHAR(4)
        .query(
          `SELECT 
            D.DEPARTMENT_ID,
            D.DEPARTMENT_NAME,
            AVG(E.SALARY) AS SALARY
          FROM DEPARTMENT D
          JOIN RESTAURANT_BRANCH RB ON RB.BRANCH_ID = D.BRANCH_ID
          JOIN EMPLOYEE E ON E.DEPARTMENT_ID = D.DEPARTMENT_ID
          WHERE RB.BRANCH_ID = @branchId
          GROUP BY D.DEPARTMENT_ID, D.DEPARTMENT_NAME`,
        );
      salaries = salariesResult.recordset;
    }

    // Render trang với danh sách chi nhánh và lương
    res.render("company/company_update_salary", {
      branches: branchesResult.recordset, // Truyền danh sách chi nhánh
      salaries, // Truyền danh sách lương (nếu có)
      branchId: branchId || null, // Truyền branchId hiện tại
      message: null, // Thông điệp hiển thị (nếu cần)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Hàm cập nhật lương
export const updateSalaries = async (req, res) => {
  const { branchId, salaries } = req.body;
  console.log(req.body);

  // Trường hợp chỉ có branchId -> Hiển thị danh sách lương
  if (branchId && !salaries) {
    try {
      const pool = await connect();

      // Lấy danh sách các chi nhánh
      const branchesResult = await pool
        .request()
        .query(`SELECT BRANCH_ID, BRANCH_NAME FROM RESTAURANT_BRANCH`);

      // Lấy danh sách lương theo branchId
      const salariesResult = await pool
        .request()
        .input("branchId", sql.Char(4), branchId) // Sửa kiểu thành CHAR(4)
        .query(
          `SELECT DISTINCT
            D.DEPARTMENT_ID,
            D.DEPARTMENT_NAME,
            E.SALARY
          FROM DEPARTMENT D
          JOIN RESTAURANT_BRANCH RB ON RB.BRANCH_ID = D.BRANCH_ID
          JOIN EMPLOYEE E ON E.DEPARTMENT_ID = D.DEPARTMENT_ID
          WHERE RB.BRANCH_ID = @branchId`,
        );
      console.log(salariesResult);
      // Render giao diện với danh sách lương
      res.render("company/company_update_salary", {
        branches: branchesResult.recordset,
        salaries: salariesResult.recordset,
        branchId,
        message: null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }

  // Trường hợp có branchId và salaries -> Thực hiện cập nhật lương
  if (branchId && salaries) {
    try {
      console.log(salaries);
      const pool = await connect();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      // Cập nhật lương
      for (const [departmentId, salary] of Object.entries(salaries)) {
        await transaction
          .request()
          .input("departmentId", sql.Char(4), departmentId) // Sửa kiểu thành CHAR(4)
          .input("salary", sql.Int, salary.replace(/\./g, "")) // Bỏ định dạng số trước khi lưu
          .query(
            `UPDATE EMPLOYEE
             SET SALARY = @salary
             WHERE DEPARTMENT_ID = @departmentId`,
          );
      }

      await transaction.commit();

      // Redirect về chính trang này với dữ liệu mới
      res.redirect(`/company/update-salary?branchId=${branchId}`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }

  // Trường hợp không có dữ liệu
  res.status(400).json({ error: "Branch ID and/or salaries are required" });
};
