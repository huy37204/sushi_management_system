import { sql, connect } from "../../database/dbConnection.js";

export const employeeBranchController = async (req, res) => {
  const { branchId } = req.params;

  const user = req.user;
  const request = new sql.Request();
  request.input("branchId", sql.NVarChar, branchId);

  try {
    const employeesList = await request.query(`
        	SELECT *
	FROM EMPLOYEE E
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @branchId
        `);
    const departmentList = await request.query(`
        	SELECT *
	FROM DEPARTMENT D
	WHERE D.BRANCH_ID = @branchId
        `);

    // Kiểm tra nếu recordset trả về có kết quả
    if (
      employeesList.recordset.length > 0 &&
      departmentList.recordset.length > 0
    ) {
      const employees = employeesList.recordset;
      const departments = departmentList.recordset;

      res.render("branch/branch_employee_list", {
        user: user,
        branchId: branchId,
        employees: employees,
        departments: departments,
      });
    } else {
      res.status(404).send("Branch not found for the given branch.");
    }
  } catch (error) {
    console.error("Error fetching employee branch details:", error);
    res.status(500).send("Internal server error.");
  }
};

export const employeeSearchController = async (req, res) => {
  const { branchId } = req.params;

  const user = req.user;
  const request = new sql.Request();
  request.input("branchId", sql.NVarChar, branchId);

  try {
    const employeesList = await request.query(`
        	SELECT *
	FROM EMPLOYEE E
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = @branchId
        `);

    // Kiểm tra nếu recordset trả về có kết quả
    if (employeesList.recordset.length > 0) {
      const employees = employeesList.recordset;

      res.render("branch/branch_employee_search", {
        user: user,
        branchId: branchId,
        employee: "",
        averageRate: "",
      });
    } else {
      res.status(404).send("Employee not found for the given branch.");
    }
  } catch (error) {
    console.error("Error fetching employee branch details:", error);
    res.status(500).send("Internal server error.");
  }
};

export const getEmployeeRating = async (req, res) => {
  try {
    const { branchId } = req.params; // Lấy branchId từ params
    const { employeeId, selectType, date, month, year, quarter } = req.body; // Lấy dữ liệu từ body

    const user = req.user; // Lấy thông tin người dùng (nếu có)
    const request = new sql.Request(); // Khởi tạo yêu cầu SQL

    // Gán các tham số cần thiết cho stored procedure
    request.input("BranchId", sql.Char(4), branchId);
    request.input("EmployeeId", sql.Char(7), employeeId);

    let result;
    if (selectType === "date") {
      request.input("DATE", sql.Date, date); // Gán ngày chọn
      result = await request.execute("getRatingByDate"); // Gọi stored procedure
    } else if (selectType === "month") {
      request.input("MONTH", sql.Int, month);
      request.input("YEAR", sql.Int, year);
      result = await request.execute("getRatingByMonth");
    } else if (selectType === "quarter") {
      request.input("Quarter", sql.Int, quarter);
      request.input("Year", sql.Int, year);
      result = await request.execute("getRatingByQuarter");
    } else if (selectType === "year") {
      request.input("YEAR", sql.Int, year);
      result = await request.execute("getRatingByYear");
    }

    // Kiểm tra kết quả trả về
    if (result && result.recordset.length > 0) {
      const {
        EMPLOYEE_ID: employee,
        FULL_NAME: fullName,
        AVERAGE_RATE: averageRate,
      } = result.recordset[0]; // Lấy kết quả đầu tiên
      res.render("branch/branch_employee_search", {
        user, // Truyền thông tin người dùng
        employee: { id: employee, name: fullName },
        averageRate,
        branchId,
      });
    } else {
      res.render("branch/branch_employee_search", {
        user,
        employee: null,
        averageRate: null,
        branchId,
      });
    }
  } catch (error) {
    console.error("Error fetching employee rating:", error);
    res.status(500).send({
      message: "Lỗi khi lấy dữ liệu đánh giá của nhân viên.",
      error: error.message,
    });
  }
};
