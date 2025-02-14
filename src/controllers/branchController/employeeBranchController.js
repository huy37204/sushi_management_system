import { sql, connect } from "../../database/dbConnection.js";

export const employeeBranchController = async (req, res) => {
  const { branchId } = req.params;
  const pageNum = parseInt(req.query.pageNum, 10) || 1; // Trang hiện tại, mặc định là trang 1
  const pageSize = 30; // Số bản ghi trên mỗi trang
  const search = req.query.search || ""; // Từ khóa tìm kiếm
  const departmentFilter = req.query.department || "all"; // Bộ phận lọc (mặc định là "all")
  const user = req.user;

  const request = new sql.Request();
  request.input("branchId", sql.NVarChar, branchId);

  try {
    // Truy vấn danh sách nhân viên
    const employeesQuery = `
      SELECT *
      FROM EMPLOYEE E
      JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID
      WHERE D.BRANCH_ID = @branchId
        AND (@search = '' OR E.FULL_NAME LIKE '%' + @search + '%' OR E.EMPLOYEE_ID LIKE '%' + @search + '%')
        AND (@department = 'all' OR D.DEPARTMENT_NAME = @department)
    `;
    request.input("search", sql.NVarChar, search);
    request.input("department", sql.NVarChar, departmentFilter);

    const employeesList = await request.query(employeesQuery);

    // Truy vấn danh sách phòng ban
    const departmentList = await request.query(`
      SELECT *
      FROM DEPARTMENT D
      WHERE D.BRANCH_ID = @branchId
    `);

    // Nếu có dữ liệu trả về

    const employees = employeesList.recordset; // Danh sách toàn bộ nhân viên đã lọc
    const totalRecords = employees.length; // Tổng số bản ghi
    const totalPages = Math.ceil(totalRecords / pageSize); // Tổng số trang

    // Cắt dữ liệu dựa trên trang hiện tại
    const paginatedEmployees = employees.slice(
      (pageNum - 1) * pageSize,
      pageNum * pageSize,
    );

    const departments = departmentList.recordset; // Danh sách phòng ban

    // Render view
    res.render("branch/branch_employee_list", {
      user: user,
      branchId: branchId,
      employees: paginatedEmployees,
      totalEmployees: totalRecords,
      departments: departments,
      currentPage: pageNum,
      totalPages: totalPages,
      search, // Từ khóa tìm kiếm
      departmentFilter, // Bộ phận lọc
    });
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
