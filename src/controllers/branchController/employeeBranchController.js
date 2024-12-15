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
        employees: employees,
      });
    } else {
      res.status(404).send("Employee not found for the given branch.");
    }
  } catch (error) {
    console.error("Error fetching employee branch details:", error);
    res.status(500).send("Internal server error.");
  }
};
