import { sql, connect } from "../../database/dbConnection.js";

export const branchController = async (req, res) => {
  const user = req.user;
  const request = new sql.Request();
  request.input("userId", sql.NVarChar, user.id);
  const branchId = await request.query(`
    SELECT B.BRANCH_ID
    FROM RESTAURANT_BRANCH B
    WHERE B.MANAGER_ID = @user.Id
    `);
  res.render("branch/branch_home", {
    branchId: branchId,
  });
};
