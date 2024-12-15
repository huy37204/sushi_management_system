import { sql } from "../../database/dbConnection.js";
import bcrypt from "bcrypt";

// Controller xử lý đăng nhập
export const loginController = async (req, res) => {
  const { username, password } = req.body;

  // Kiểm tra đầu vào
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    // Tạo request và khai báo tham số
    const request = new sql.Request();
    request.input("username", sql.NVarChar, username);

    // Truy vấn lấy thông tin người dùng
    const result = await request.query(`
      EXEC getUserIdByAccount @USERNAME = @username
    `);

    // Kiểm tra kết quả trả về
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result.recordset[0];

    // So sánh mật khẩu
    const passwordMatch = await bcrypt.compare(password, user.PASSWORD);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Lưu thông tin người dùng vào session
    req.session.user = {
      id: user.Id,
      role: user.ROLE,
      name: user.Name,
    };

    // Đặt cookie
    res.cookie("userInfo", JSON.stringify(req.session.user), {
      maxAge: 1000 * 60 * 60 * 24 * 7, // Cookie hết hạn sau 7 ngày
      httpOnly: true, // Đảm bảo cookie chỉ đọc được bởi server
    });

    // Phân nhánh theo vai trò
    switch (user.ROLE) {
      case "Quản lý công ty":
        return res.redirect("/company");
      case "Nhân viên":
        return res.redirect("/employee");
      case "Khách hàng":
        return res.redirect("/");
      case "Quản lý chi nhánh": {
        // Tìm branchId cho Quản lý chi nhánh
        const branchRequest = new sql.Request();
        branchRequest.input("userId", sql.NVarChar, user.Id);

        const branchResult = await branchRequest.query(`
          SELECT B.BRANCH_ID
          FROM RESTAURANT_BRANCH B
          WHERE B.MANAGER_ID = @userId
        `);

        if (branchResult.recordset.length > 0) {
          const branchId = branchResult.recordset[0].BRANCH_ID;
          return res.redirect(`/branch/${branchId}`);
        } else {
          return res.status(404).send("Branch not found");
        }
      }
      default:
        return res.status(400).send("Role không hợp lệ.");
    }
  } catch (err) {
    console.error("Lỗi khi xác thực người dùng:", err);
    return res.status(500).send("Lỗi khi xác thực người dùng");
  }
};
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      password,
      confirmPassword,
      gender,
      phone_number,
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (
      !name ||
      !email ||
      !username ||
      !password ||
      !confirmPassword ||
      !gender ||
      !phone_number
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Kiểm tra mật khẩu khớp
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Tạo request để kiểm tra tồn tại của người dùng
    const checkRequest = new sql.Request();
    checkRequest.input("email", sql.NVarChar, email);
    checkRequest.input("username", sql.NVarChar, username);

    const existingEmail = await checkRequest.query(
      "SELECT * FROM CUSTOMER WHERE EMAIL = @email",
    );
    const existingUsername = await checkRequest.query(
      "SELECT * FROM ACCOUNT WHERE USERNAME = @username",
    );

    if (
      existingEmail.recordset.length > 0 ||
      existingUsername.recordset.length > 0
    ) {
      return res
        .status(400)
        .json({ message: "Email or username already exists" });
    }

    // Lấy giá trị customer_id cuối cùng từ cơ sở dữ liệu
    const customerRequest = new sql.Request();
    const customerResult = await customerRequest.query(
      "SELECT TOP 1 CUSTOMER_ID FROM CUSTOMER ORDER BY CUSTOMER_ID DESC",
    );

    let newCustomerId = "000001C"; // Giá trị mặc định nếu chưa có dữ liệu

    if (customerResult.recordset.length > 0) {
      // Lấy giá trị CUSTOMER_ID cuối cùng
      const lastCustomerId = customerResult.recordset[0].CUSTOMER_ID;

      // Tách phần số và phần ký tự
      const numberPart =
        parseInt(lastCustomerId.substring(0, lastCustomerId.length - 1)) + 1;
      const charPart = lastCustomerId.charAt(lastCustomerId.length - 1); // Phần ký tự cuối cùng

      // Đảm bảo phần số có đúng 6 chữ số
      newCustomerId = numberPart.toString().padStart(6, "0") + charPart;
    }

    // Lấy giá trị ACCOUNT_ID cuối cùng từ cơ sở dữ liệu
    const accountRequest = new sql.Request();
    const accountResult = await accountRequest.query(
      "SELECT TOP 1 ACCOUNT_ID FROM ACCOUNT ORDER BY ACCOUNT_ID DESC",
    );

    let account_id = "A001"; // Giá trị mặc định nếu chưa có dữ liệu

    if (accountResult.recordset.length > 0) {
      // Lấy giá trị ACCOUNT_ID cuối cùng
      const lastAccountId = accountResult.recordset[0].ACCOUNT_ID;

      // Tăng giá trị lên 1 đơn vị
      const numberPart = parseInt(lastAccountId.substring(1)) + 1;
      account_id = "A" + numberPart.toString().padStart(3, "0"); // Đảm bảo định dạng 3 chữ số
    }

    // Hash mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo request để chèn dữ liệu vào bảng CUSTOMER
    const insertCustomerRequest = new sql.Request();
    insertCustomerRequest.input("customer_id", sql.VarChar, newCustomerId);
    insertCustomerRequest.input("name", sql.NVarChar, name);
    insertCustomerRequest.input("email", sql.NVarChar, email);
    insertCustomerRequest.input("phone_number", sql.NVarChar, phone_number);
    insertCustomerRequest.input("gender", sql.NVarChar, gender);

    await insertCustomerRequest.query(`
      INSERT INTO CUSTOMER (CUSTOMER_ID, FULL_NAME, PHONE_NUMBER, EMAIL, GENDER)
      VALUES (@customer_id, @name, @phone_number, @email, @gender)
    `);

    // Chèn dữ liệu vào bảng ACCOUNT
    const insertAccountRequest = new sql.Request();
    insertAccountRequest.input("account_id", sql.NVarChar, account_id);
    insertAccountRequest.input("username", sql.NVarChar, username);
    insertAccountRequest.input("password", sql.NVarChar, hashedPassword);
    insertAccountRequest.input("role", sql.NVarChar, "Khách hàng"); // Đặt mặc định là "Khách hàng"
    insertAccountRequest.input("customer_id", sql.NVarChar, newCustomerId);

    await insertAccountRequest.query(`
      INSERT INTO ACCOUNT (ACCOUNT_ID, USERNAME, PASSWORD, ROLE, CUSTOMER_ID)
      VALUES (@account_id, @username, @password, @role, @customer_id)
    `);

    req.session.user = {
      id: newCustomerId,
      role: "Khách hàng",
      name: name,
    };

    // Lưu thông tin vào cookie
    res.cookie("userInfo", JSON.stringify(req.session.user), {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });

    // Redirect người dùng về trang chủ
    res.redirect("/");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
