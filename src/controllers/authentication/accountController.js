import { sql } from "../../database/dbConnection.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

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
     EXEC getUserIdByAccount @USER_NAME = @username`);

    if (result.recordset.length === 0) {
      // Nếu không tìm thấy người dùng, quay lại trang login
      res.redirect("/login");
      return;
    }

    const user = result.recordset[0];

    if (user.PASSWORD !== password) {
      return res.redirect("/login");
    }
    // Lưu thông tin người dùng vào req.user
    req.session.user = {
      id: user.Id,
      role: user.ROLE,
      name: user.Name,
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

// Controller xử lý đăng nhập
// export const loginController = async (req, res) => {
//   const { username, password } = req.body;
//   console.log(password);
//   try {
//     // Tạo request và khai báo tham số
//     const request = new sql.Request();
//     request.input("username", sql.NVarChar, username);

//     // Truy vấn lấy thông tin người dùng
//     const result = await request.query(`
//       EXEC getUserIdByAccount @USER_NAME = @username
//     `);

//     if (result.recordset.length === 0) {
//       // Nếu không tìm thấy người dùng
//       return res.status(401).json({ message: "Invalid username or password" });
//     }

//     const user = result.recordset[0];

//     // So sánh mật khẩu đã nhập với mật khẩu mã hóa trong cơ sở dữ liệu
//     const passwordMatch = await bcrypt.compare(password, user.PASSWORD);

//     if (!passwordMatch) {
//       // Mật khẩu không khớp
//       return res.status(401).json({ message: "Invalid username or password" });
//     }

//     // Lưu thông tin người dùng vào session
//     req.session.user = {
//       id: user.Id,
//       role: user.ROLE,
//       name: user.Name,
//     };

//     // Chuyển hướng theo vai trò người dùng
//     if (user.ROLE === "Quản lý công ty") {
//       return res.redirect("/company");
//     } else if (user.ROLE === "Lễ tân" || user.ROLE === "Thu ngân") {
//       return res.redirect("/employee");
//     } else if (user.ROLE === "Khách hàng") {
//       return res.redirect("/");
//     }

//     // Nếu không khớp với role nào, trả về lỗi
//     return res.status(400).send("Role không hợp lệ.");
//   } catch (err) {
//     console.error("Lỗi khi xác thực người dùng:", err);
//     return res.status(500).send("Lỗi khi xác thực người dùng");
//   }
// };

// Hàm tạo ID ngẫu nhiên có độ dài 6 ký tự
const generateRandomId = (length = 6) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
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
      "SELECT * FROM ACCOUNT WHERE USER_NAME = @username",
    );

    if (
      existingEmail.recordset.length > 0 ||
      existingUsername.recordset.length > 0
    ) {
      return res
        .status(400)
        .json({ message: "Email or username already exists" });
    }

    // Tạo các ID mới dưới dạng CHAR(6)
    const customer_id = generateRandomId();
    const account_id = generateRandomId();

    // Hash mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo request để chèn dữ liệu
    const customerRequest = new sql.Request();
    customerRequest.input("customer_id", sql.Char(6), customer_id);
    customerRequest.input("name", sql.NVarChar, name);
    customerRequest.input("email", sql.NVarChar, email);
    customerRequest.input("phone_number", sql.NVarChar, phone_number);
    customerRequest.input("gender", sql.NVarChar, gender);

    await customerRequest.query(`
      INSERT INTO CUSTOMER (CUSTOMER_ID, FULL_NAME, PHONE_NUMBER, EMAIL, GENDER)
      VALUES (@customer_id, @name, @phone_number, @email, @gender)
    `);

    const accountRequest = new sql.Request();
    accountRequest.input("account_id", sql.Char(6), account_id);
    accountRequest.input("username", sql.NVarChar, username);
    accountRequest.input("password", sql.NVarChar, hashedPassword);
    accountRequest.input("role", sql.NVarChar, "Khách hàng"); // Đặt mặc định là "Khách hàng"
    accountRequest.input("customer_id", sql.Char(6), customer_id);

    await accountRequest.query(`
      INSERT INTO ACCOUNT (ACCOUNT_ID, USER_NAME, PASSWORD, ROLE, CUSTOMER_ID)
      VALUES (@account_id, @username, @password, @role, @customer_id)
    `);

    req.session.user = {
      id: customer_id,
      role: "Khách hàng",
      name: name,
    };

    // Redirect người dùng về trang chủ
    res.redirect("/");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
