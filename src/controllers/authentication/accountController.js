import { sql } from "../../database/dbConnection.js";

// Controller xử lý đăng nhập
export const loginController = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Tạo request và sử dụng input để truyền các tham số vào
    const request = new sql.Request();

    // Khai báo tham số
    request.input("username", sql.NVarChar, username);
    request.input("password", sql.VarChar, password);

    // Sử dụng parameterized query để tránh SQL Injection
    const result = await request.query(`
      SELECT * FROM dbo.getUserIdByAccount(@username, @password)
    `);

    if (result.recordset.length === 0) {
      // Nếu không tìm thấy người dùng, quay lại trang login
      res.redirect("/login");
      return;
    }

    const user = result.recordset[0];

    // Lưu thông tin người dùng vào req.user
    req.session.user = {
      id: user.Id,
      role: user.ROLE,
    };

    // Chuyển hướng theo vai trò người dùng
    if (user.ROLE === "Quản lý công ty") {
      return res.redirect("/company");
    } else if (user.ROLE === "Lễ tân" || user.ROLE === "Thu ngân") {
      return res.redirect("/employee");
    } else if (user.ROLE === "Khách hàng") {
      return res.redirect("/");
    }

    // Nếu không khớp với role nào, trả về lỗi
    return res.status(400).send("Role không hợp lệ.");
  } catch (err) {
    console.error("Lỗi khi xác thực người dùng:", err);
    return res.status(500).send("Lỗi khi xác thực người dùng");
  }
};
