import { sql } from "../../database/dbConnection.js";
import bcrypt from "bcrypt";

// Controller xử lý đăng nhập
export const loginController = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    const request = new sql.Request();
    request.input("username", sql.NVarChar, username);

    const result = await request.query(`
      EXEC getUserIdByAccount @USERNAME = @username
    `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result.recordset[0];
    console.log(user);
    const passwordMatch = await bcrypt.compare(password, user.PASSWORD);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    req.session.user = {
      id: user.Id,
      role: user.ROLE,
      name: user.Name,
    };
    // Lấy thông tin Membership Card
    const cardRequest = new sql.Request();
    cardRequest.input("customerId", sql.NVarChar, user.Id);

    const cardResult = await cardRequest.query(`
      EXEC getMembershipCardInfo @CustomerID = @customerId
    `);

    if (cardResult.recordset.length > 0) {
      const cardInfo = cardResult.recordset[0];
      req.session.membershipCard = {
        cardId: cardInfo.CARD_ID,
        cardType: cardInfo.CARD_TYPE,
        dateIssued: cardInfo.DATE_ISSUED,
        points: cardInfo.POINTS,
        cardStatus: cardInfo.CARD_STATUS,
        discountAmount: cardInfo.DISCOUNT_AMOUNT,
      };
    }

    res.cookie("userInfo", JSON.stringify(req.session.user), {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });

    switch (user.ROLE) {
      case "Quản lý công ty":
        return res.redirect("/company");
      case "Nhân viên":
        return res.redirect("/employee");
      case "Khách hàng":
        return res.redirect("/");
      case "Quản lý chi nhánh": {
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

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

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

    const customerRequest = new sql.Request();
    const customerResult = await customerRequest.query(
      "SELECT TOP 1 CUSTOMER_ID FROM CUSTOMER ORDER BY CUSTOMER_ID DESC",
    );

    let newCustomerId = "000001C";

    if (customerResult.recordset.length > 0) {
      const lastCustomerId = customerResult.recordset[0].CUSTOMER_ID;
      const numberPart =
        parseInt(lastCustomerId.substring(0, lastCustomerId.length - 1)) + 1;
      const charPart = lastCustomerId.charAt(lastCustomerId.length - 1);
      newCustomerId = numberPart.toString().padStart(6, "0") + charPart;
    }

    const accountRequest = new sql.Request();
    const accountResult = await accountRequest.query(
      "SELECT TOP 1 ACCOUNT_ID FROM ACCOUNT ORDER BY ACCOUNT_ID DESC",
    );

    let account_id = "A001";

    if (accountResult.recordset.length > 0) {
      const lastAccountId = accountResult.recordset[0].ACCOUNT_ID;
      const numberPart = parseInt(lastAccountId.substring(1)) + 1;
      account_id = "A" + numberPart.toString().padStart(3, "0");
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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

    const insertAccountRequest = new sql.Request();
    insertAccountRequest.input("account_id", sql.NVarChar, account_id);
    insertAccountRequest.input("username", sql.NVarChar, username);
    insertAccountRequest.input("password", sql.NVarChar, hashedPassword);
    insertAccountRequest.input("role", sql.NVarChar, "Khách hàng");
    insertAccountRequest.input("customer_id", sql.NVarChar, newCustomerId);

    await insertAccountRequest.query(`
      INSERT INTO ACCOUNT (ACCOUNT_ID, USERNAME, PASSWORD, ROLE, CUSTOMER_ID)
      VALUES (@account_id, @username, @password, @role, @customer_id)
    `);

    // Tạo Membership Card cho người dùng
    const membershipCardRequest = new sql.Request();
    membershipCardRequest.input("customerId", sql.NVarChar, newCustomerId);
    membershipCardRequest.input("cardType", sql.NVarChar, "Standard");
    membershipCardRequest.input("dateIssued", sql.DateTime, new Date());
    membershipCardRequest.input("points", sql.Int, 0);
    membershipCardRequest.input("cardStatus", sql.NVarChar, "Active");
    membershipCardRequest.input("discountAmount", sql.Float, 0);

    await membershipCardRequest.query(`
      INSERT INTO MEMBERSHIP_CARD (CUSTOMER_ID, CARD_TYPE, DATE_ISSUED, POINTS, CARD_STATUS, DISCOUNT_AMOUNT)
      VALUES (@customerId, @cardType, @dateIssued, @points, @cardStatus, @discountAmount)
    `);

    req.session.user = {
      id: newCustomerId,
      role: "Khách hàng",
      name: name,
    };

    res.cookie("userInfo", JSON.stringify(req.session.user), {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });

    res.redirect("/");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
