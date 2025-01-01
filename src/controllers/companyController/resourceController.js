import { sql, connect } from "../../database/dbConnection.js";
import bcrypt from "bcrypt";

export const resourceController = async (req, res) => {
  const { branchId } = req.query;
  const user = req.user;
  const request = new sql.Request();

  try {
    // Lấy danh sách chi nhánh
    const branchResult = await request.query(`
        SELECT B.BRANCH_ID, B.BRANCH_NAME
        FROM RESTAURANT_BRANCH B
      `);

    if (branchResult.recordset.length === 0) {
      return res.status(404).send("Không tìm thấy chi nhánh.");
    }

    const branches = branchResult.recordset;
    request.input("branchId", sql.Char(7), branchId);
    // Lấy danh sách nhân viên
    const employeeResult = await request.query(`
        SELECT 
          E.EMPLOYEE_ID, 
          E.FULL_NAME, 
          E.GENDER, 
          E.DATE_OF_BIRTH, 
          E.START_DATE_WORK, 
          E.TERMINATION_DATE, 
          E.SALARY, 
          E.DEPARTMENT_ID,
          D.DEPARTMENT_NAME
        FROM EMPLOYEE E
        JOIN DEPARTMENT D 
          ON D.DEPARTMENT_ID = E.DEPARTMENT_ID 
          AND D.BRANCH_ID = @branchId
      `);

    const employeeList = employeeResult.recordset;

    // Gán giá trị input cho branchId

    // Lấy danh sách phòng ban theo chi nhánh
    const departmentResult = await request.query(`
        SELECT DEPARTMENT_ID, DEPARTMENT_NAME
        FROM DEPARTMENT
        WHERE BRANCH_ID = @branchId
      `);
    const departmentList = departmentResult.recordset;

    // Render dữ liệu ra view
    res.render("company/company_resource", {
      branchId: branchId || null,
      user: user,
      branches,
      employeeList: employeeList || null,
      departmentList: departmentList || null,
    });
  } catch (error) {
    console.error("Error fetching company details:", error);
    res.status(500).send("Internal server error.");
  }
};

export const resourceTransferController = async (req, res) => {
  const { employeeId, branchId } = req.query;
  const user = req.user;
  const request = new sql.Request();

  // Thêm input employeeId vào truy vấn SQL
  request.input("employeeId", sql.Char(7), employeeId);

  // Truy vấn lấy thông tin nhân viên
  const employeeData = await request.query(`
    SELECT E.EMPLOYEE_ID, E.FULL_NAME, D.DEPARTMENT_ID, D.DEPARTMENT_NAME, D.BRANCH_ID
    FROM EMPLOYEE E
    JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID
    WHERE E.EMPLOYEE_ID = @employeeId
  `);

  const employee = employeeData.recordset[0]; // Lấy thông tin nhân viên đầu tiên

  // Truy vấn lấy thông tin chi nhánh theo phòng ban
  request.input("departmentName", sql.NVarChar, employee.DEPARTMENT_NAME);
  const branchData = await request.query(`
    SELECT B.BRANCH_ID, B.BRANCH_NAME, D.DEPARTMENT_ID
    FROM RESTAURANT_BRANCH B
    JOIN DEPARTMENT D ON D.DEPARTMENT_NAME = @departmentName AND D.BRANCH_ID = B.BRANCH_ID
  `);

  const branches = branchData.recordset;
  // Truyền dữ liệu vào view
  res.render("company/company_resource_transfer", {
    branchId,
    user,
    employee,
    branches,
  });
};

export const transferResource = async (req, res) => {
  const { employeeId } = req.query;
  const { departmentId } = req.body;

  try {
    const request = new sql.Request();

    // Input parameters
    request.input("employeeId", sql.Char(7), employeeId);
    request.input("departmentId", sql.Char(4), departmentId);

    // Lấy ngày hiện tại của Việt Nam
    const currentDate = new Date().toISOString().split("T")[0]; // yyyy-MM-dd
    request.input("currentDate", sql.Date, currentDate);

    // Tìm ngày bắt đầu gần đây nhất (branch_start_date gần nhất)
    const recentStartDateQuery = await request.query(`
      SELECT TOP 1 BRANCH_START_DATE
      FROM WORK_HISTORY
      WHERE EMPLOYEE_ID = @employeeId
      ORDER BY BRANCH_START_DATE DESC
    `);

    if (recentStartDateQuery.recordset.length === 0) {
      return res.status(400).send("No work history found for the employee.");
    }

    const recentStartDate = recentStartDateQuery.recordset[0].BRANCH_START_DATE;
    request.input("recentStartDate", sql.Date, recentStartDate);

    // Cập nhật ngày kết thúc branch_end_date
    await request.query(`
      UPDATE WORK_HISTORY
      SET BRANCH_END_DATE = @currentDate
      WHERE BRANCH_START_DATE = @recentStartDate AND EMPLOYEE_ID = @employeeId
    `);

    // Lấy branch_id từ bảng DEPARTMENT
    const branchQuery = await request.query(`
      SELECT BRANCH_ID
      FROM DEPARTMENT
      WHERE DEPARTMENT_ID = @departmentId
    `);

    if (branchQuery.recordset.length === 0) {
      return res
        .status(400)
        .send("No branch found for the specified department.");
    }

    const branchId = branchQuery.recordset[0].BRANCH_ID;

    // Chèn dữ liệu mới vào WORK_HISTORY
    await request.query(`
      INSERT INTO WORK_HISTORY (BRANCH_START_DATE, BRANCH_END_DATE, EMPLOYEE_ID, BRANCH_ID)
      VALUES (@currentDate, NULL, @employeeId, '${branchId}')
    `);

    // Cập nhật department_id trong bảng EMPLOYEE
    await request.query(`
      UPDATE EMPLOYEE
      SET DEPARTMENT_ID = @departmentId
      WHERE EMPLOYEE_ID = @employeeId
    `);

    // Chuyển hướng đến trang danh sách tài nguyên
    res.redirect("/company/resource");
  } catch (error) {
    console.error("Error transferring resource:", error);
    res.status(500).send("Error transferring resource");
  }
};

export const resourceUpdateController = async (req, res) => {
  const { employeeId, branchId } = req.query;
  const request = new sql.Request();
  // Thêm input employeeId vào truy vấn SQL
  request.input("employeeId", sql.Char(7), employeeId);
  const employeeData = await request.query(`
    SELECT *
    FROM EMPLOYEE
    WHERE EMPLOYEE_ID = @employeeId
    `);
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const employee = employeeData.recordset[0];
  if (employee) {
    employee.DATE_OF_BIRTH = formatDate(employee.DATE_OF_BIRTH);
    employee.TERMINATION_DATE = formatDate(employee.TERMINATION_DATE);
    employee.START_DATE_WORK = formatDate(employee.START_DATE_WORK);
  }
  request.input("branchId", sql.Char(7), branchId);

  const departmentData = await request.query(`
    SELECT DEPARTMENT_ID, DEPARTMENT_NAME
    FROM DEPARTMENT
    WHERE BRANCH_ID = @branchId
    `);
  const departments = departmentData.recordset;
  res.render("company/company_resource_update", { employee, departments });
};

export const updateResource = async (req, res) => {
  try {
    const {
      employeeId,
      fullName,
      gender,
      department,
      dob,
      terminationDate,
      startDateWork,
    } = req.body;

    // Kết nối cơ sở dữ liệu
    const request = new sql.Request();

    // Thêm các tham số vào thủ tục
    request.input("EmployeeId", sql.Char(7), employeeId);
    request.input("FullName", sql.NVarChar(255), fullName);
    request.input("Gender", sql.NVarChar(50), gender);
    request.input("DepartmentId", sql.Char(7), department);
    request.input("Dob", sql.Date, dob || null);
    request.input("TerminationDate", sql.Date, terminationDate || null);
    request.input("StartDateWork", sql.Date, startDateWork);

    // Gọi thủ tục
    await request.execute("UpdateEmployeeAndWorkHistory");

    // Chuyển hướng sau khi cập nhật thành công
    res.redirect(`/company/resource`);
  } catch (error) {
    console.error("Error updating employee:", error);

    // Gửi thông báo lỗi
    res.status(500).send("Error updating employee. Please try again.");
  }
};

export const deleteResource = async (req, res) => {
  const { employeeId } = req.body;

  try {
    const request = new sql.Request();
    request.input("employeeId", sql.Char(7), employeeId);

    // Xóa liên kết trong bảng MEMBERSHIP_CARD

    await request.query(`
      UPDATE MEMBERSHIP_CARD
      SET EMPLOYEE_ID = NULL
      WHERE EMPLOYEE_ID = @employeeId
    `);
    await request.query(`
      DELETE FROM WORK_HISTORY
      WHERE EMPLOYEE_ID = @employeeId
      `);
    // Xóa tài khoản nhân viên
    await request.query(`
      DELETE FROM ACCOUNT
      WHERE EMPLOYEE_ID = @employeeId
    `);

    // Xóa nhân viên
    await request.query(`
      DELETE FROM EMPLOYEE
      WHERE EMPLOYEE_ID = @employeeId
    `);

    // Chuyển hướng về trang danh sách tài nguyên
    res.redirect("/company/resource");
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).send("Error deleting resource");
  }
};

export const addResourceController = async (req, res) => {
  const { branchId } = req.query;
  const request = new sql.Request();
  request.input("branchId", sql.Char(7), branchId);
  const departmentData = await request.query(`
    SELECT DEPARTMENT_ID, DEPARTMENT_NAME
    FROM DEPARTMENT
    WHERE BRANCH_ID = @branchId
    `);
  const departments = departmentData.recordset;
  res.render("company/company_resource_add", { branchId, departments });
};

export const addResource = async (req, res) => {
  const { fullName, gender, dob, departmentId, startDayWork } = req.body;
  const { branchId } = req.query;
  const request = new sql.Request();

  try {
    // Lấy ngày hiện tại của Việt Nam (UTC+7)
    const vietnamDate = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
    );
    const currentDate = vietnamDate.toISOString().split("T")[0]; // yyyy-MM-dd
    request.input("branchId", sql.Char(7), branchId);
    request.input("currentDate", sql.Date, currentDate);
    request.input("fullName", sql.NVarChar, fullName);
    request.input("gender", sql.VarChar, gender);
    request.input("dob", sql.Date, dob);
    request.input("startDayWork", sql.Date, startDayWork);
    request.input("departmentId", sql.Char(4), departmentId);
    console.log(departmentId);
    // Lấy salary của department
    const salaryData = await request.query(`
      SELECT TOP 1 SALARY
      FROM EMPLOYEE
      WHERE DEPARTMENT_ID = @departmentId
    `);
    const salary = salaryData.recordset[0]?.SALARY || 20000; // Default to 0 if no salary found
    request.input("salary", sql.Int, salary);
    // Lấy EMPLOYEE_ID cao nhất và cộng thêm 1
    const employeeIdData = await request.query(`
      SELECT MAX(CAST(SUBSTRING(EMPLOYEE_ID, 2, 6) AS INT)) AS MaxEmployeeId
      FROM EMPLOYEE
    `);
    const maxEmployeeId = employeeIdData.recordset[0].MaxEmployeeId || 0;
    const employeeId = `E${(maxEmployeeId + 1).toString().padStart(6, "0")}`;
    request.input("employeeId", sql.Char(7), employeeId);

    // Lấy ACCOUNT_ID cao nhất và cộng thêm 1
    const accountIdData = await request.query(`
      SELECT MAX(CAST(SUBSTRING(ACCOUNT_ID, 2, 3) AS INT)) AS MaxAccountId
      FROM ACCOUNT
    `);
    const maxAccountId = accountIdData.recordset[0].MaxAccountId || 0;
    const accountId = `A${(maxAccountId + 1).toString().padStart(3, "0")}`; // Đảm bảo ACCOUNT_ID có 3 chữ số
    request.input("accountId", sql.Char(4), accountId); // Lưu vào input với định dạng A000

    // Tạo username từ họ tên và ngày sinh
    const dobString = new Date(dob)
      .toLocaleDateString("en-GB")
      .split("/")
      .join("");
    const username =
      fullName
        .split(" ")
        .map((name) => name[0].toLowerCase())
        .join("") + dobString;
    request.input("username", sql.NVarChar, username);

    // Xác định role
    const departmentData = await request.query(`
      SELECT DEPARTMENT_NAME
      FROM DEPARTMENT
      WHERE DEPARTMENT_ID = @departmentId
    `);
    const role =
      departmentData.recordset[0]?.DEPARTMENT_NAME === "Quản lý chi nhánh"
        ? "Quản lý chi nhánh"
        : "Nhân viên";
    request.input("role", sql.NVarChar, role);

    // Hash password
    const hashedPassword = await bcrypt.hash("123", 10);
    request.input("hashedPassword", sql.NVarChar, hashedPassword);

    // Insert vào bảng EMPLOYEE
    await request.query(`
      INSERT INTO EMPLOYEE (EMPLOYEE_ID, FULL_NAME, DATE_OF_BIRTH, GENDER, SALARY, START_DATE_WORK, DEPARTMENT_ID)
      VALUES (@employeeId, @fullName, @dob, @gender, @salary, @startDayWork, @departmentId)
    `);

    // Insert vào bảng ACCOUNT
    await request.query(`
      INSERT INTO ACCOUNT (ACCOUNT_ID, USERNAME, PASSWORD, ROLE, EMPLOYEE_ID)
      VALUES (@accountId, @username, @hashedPassword, @role, @employeeId)
    `);

    await request.query(`
      INSERT INTO WORK_HISTORY (BRANCH_START_DATE, EMPLOYEE_ID, BRANCH_ID)
      VALUES (@startDayWork, @employeeId, @branchId)
      `);

    res.redirect("/company/resource");
  } catch (error) {
    console.error("Error adding resource:", error);
    res.status(500).send("Error adding resource");
  }
};
