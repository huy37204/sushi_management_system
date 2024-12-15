import { sql } from "../../database/dbConnection.js";
import { getMenuDropDownItem } from "../menuController/menuDropdownController.js";
export const menuController = async (req, res) => {
  try {
    const { branchId } = req.query; // Lấy branchId từ query params

    const request = new sql.Request();
    // Retrieve branches
    const branchesData = await request.query(
      `SELECT BRANCH_ID, BRANCH_NAME FROM RESTAURANT_BRANCH`,
    );

    // Khởi tạo biến cho menu
    let categoriesWithDishes = [];

    // Nếu có branchId, tải menu
    if (branchId) {
      request.input("branchId", sql.VarChar, branchId);

      // Retrieve menu data grouped by CATEGORY_NAME
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
                            DISH_AVAILABLE DA ON DA.BRANCH_ID = @branchId AND DA.DISH_ID = D.DISH_ID AND DA.IS_AVAILABLE = 1
                        WHERE 
                            D.CATEGORY_NAME = MC.CATEGORY_NAME
                        FOR JSON PATH
                    ) AS DISHES
                FROM 
                    (SELECT DISTINCT CATEGORY_NAME FROM DISH) MC
                ORDER BY 
                    MC.CATEGORY_NAME;
            `);

      // Process the JSON response and handle empty dishes
      categoriesWithDishes = menuData.recordset.map((row) => ({
        categoryName: row.CATEGORY_NAME,
        dishes: row.DISHES ? JSON.parse(row.DISHES) : [],
      }));
    }
    const menuDropDownData = await getMenuDropDownItem();
    // Render the menu view với danh sách chi nhánh và menu (nếu có)
    res.render("customer/menu", {
      activePage: "menu",
      user: req.user || null,
      categoriesWithDishes,
      menuDropDownData,
      branches: branchesData.recordset, // Gửi danh sách chi nhánh đến view
    });
  } catch (error) {
    console.error("Error loading menu:", error);
    res.status(500).json({
      message: "Lỗi khi load menu",
      error: error.message,
    });
  }
};
