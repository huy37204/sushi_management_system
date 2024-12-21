import { sql, connect } from "../../database/dbConnection.js";

export const customerCardBranchController = async (req, res) => {
  const { branchId } = req.params;
  const { user } = req.user;
  res.render("branch/branch_customer_card", {
    branchId,
    user,
    membershipCard: "",
  });
};

export const getCustomerCardByPhone = async (req, res) => {
  const { branchId } = req.params;
  const { user } = req.user;
  const { phoneNum } = req.body;
  const request = new sql.Request();

  const result = await request.input("phoneNum", sql.Char(15), phoneNum).query(`
      SELECT 
        MC.CARD_ID, 
        MC.DATE_ISSUED, 
        MC.POINTS, 
        MC.CARD_STATUS, 
        MC.CARD_TYPE,
        C.CUSTOMER_ID, 
        C.FULL_NAME, 
        C.EMAIL, 
        C.PHONE_NUMBER
      FROM MEMBERSHIP_CARD MC
      JOIN CUSTOMER C 
        ON C.CUSTOMER_ID = MC.CUSTOMER_ID 
      WHERE C.PHONE_NUMBER = @phoneNum
    `);

  const membershipCard = result.recordset; // Lấy kết quả truy vấn

  res.render("branch/branch_customer_card", {
    branchId,
    user,
    membershipCard,
  });
};

export const createNewCustomerCard = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { fullName, phoneNumber, email, identityCard, gender } = req.body;
    // Thông tin nhân viên (lấy từ session hoặc req.user)
    const employeeId = req.user.id; // Giả định có sẵn thông tin nhân viên trong req.user

    // Tạo một request mới
    const request = new sql.Request();

    // Gọi thủ tục với các tham số
    request
      .input("fullName", sql.NVarChar, fullName)
      .input("phoneNumber", sql.Char(15), phoneNumber)
      .input("email", sql.Char(50), email)
      .input("identityCard", sql.Char(15), identityCard)
      .input("gender", sql.NVarChar(5), gender)
      .input("employeeId", sql.Char(7), employeeId);

    await request.execute("createCustomerCardForNew");

    // Chuyển hướng lại trang quản lý thẻ khách hàng
    res.redirect(`/branch/${branchId}/customer-card`);
  } catch (error) {
    console.error("Error creating new customer card:", error);

    // Trả về trang báo lỗi (hoặc xử lý lỗi tùy chỉnh)
    res.status(500).send("Có lỗi xảy ra khi tạo thẻ khách hàng mới.");
  }
};

export const createOldCustomerCard = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { phoneNumber, identityCard } = req.body;
    // Thông tin nhân viên (lấy từ session hoặc req.user)
    const employeeId = req.user.id; // Giả định có sẵn thông tin nhân viên trong req.user

    // Tạo một request mới
    const request = new sql.Request();

    // Gọi thủ tục với các tham số
    request
      .input("phoneNumber", sql.Char(15), phoneNumber)
      .input("identityCard", sql.Char(15), identityCard)
      .input("employeeId", sql.Char(7), employeeId);

    await request.execute("createCustomerCardForOld");

    // Chuyển hướng lại trang quản lý thẻ khách hàng
    res.redirect(`/branch/${branchId}/customer-card`);
  } catch (error) {
    console.error("Error creating new customer card:", error);

    // Trả về trang báo lỗi (hoặc xử lý lỗi tùy chỉnh)
    res.status(500).send("Có lỗi xảy ra khi tạo thẻ khách hàng mới.");
  }
};

export const deleteCard = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { cardId } = req.body;

    // Tạo một request mới
    const request = new sql.Request();

    // Kiểm tra thẻ có tồn tại không trước khi xóa
    const checkCardExistence = await request.input(
      "cardId",
      sql.Char(7),
      cardId,
    ).query(`
        SELECT 1 FROM MEMBERSHIP_CARD WHERE CARD_ID = @cardId
      `);

    if (checkCardExistence.recordset.length === 0) {
      // Nếu thẻ không tồn tại, trả về thông báo lỗi
      return res.status(404).send("Thẻ không tồn tại.");
    }

    // Thực hiện xóa thẻ nếu tồn tại
    await request.query(`
        DELETE FROM MEMBERSHIP_CARD
        WHERE CARD_ID = @cardId
      `);

    // Chuyển hướng lại trang quản lý thẻ khách hàng
    res.redirect(`/branch/${branchId}/customer-card`);
  } catch (error) {
    console.error("Error deleting customer card:", error);

    // Trả về trang báo lỗi với thông điệp chi tiết hơn
    res.status(500).send("Có lỗi xảy ra khi xóa thẻ khách hàng.");
  }
};

export const updateCardController = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { cardId } = req.query;
    const { user } = req.user;

    // Tạo một request mới
    const request = new sql.Request();
    // Thực hiện truy vấn để lấy thẻ khách hàng
    const result = await request.input("cardId", sql.Char(7), cardId).query(`
        SELECT C.CARD_ID, C.CARD_TYPE, C.CUSTOMER_ID, C.DATE_ISSUED, C.EMPLOYEE_ID, C.POINTS, C.CARD_STATUS, C.DISCOUNT_AMOUNT, CUS.FULL_NAME
        FROM MEMBERSHIP_CARD C
        JOIN CUSTOMER CUS ON CUS.CUSTOMER_ID = C.CUSTOMER_ID
        WHERE C.CARD_ID = @cardId
      `);

    const membershipCard = result.recordset;
    if (membershipCard.length === 0) {
      // Nếu không tìm thấy thẻ, trả về lỗi
      return res.status(404).send("Thẻ khách hàng không tồn tại.");
    }
    // Chuyển hướng lại trang cập nhật thẻ khách hàng
    res.render("branch/branch_customer_card_update", {
      branchId,
      user,
      membershipCard: membershipCard[0], // Trả về thẻ khách hàng đầu tiên nếu tìm thấy
    });
  } catch (error) {
    console.error("Error updating customer card:", error);

    // Trả về trang báo lỗi với thông điệp chi tiết hơn
    res.status(500).send("Có lỗi xảy ra khi cập nhật thẻ khách hàng.");
  }
};

export const updateCard = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { cardId, cardStatus } = req.body;

    // Tạo một request mới
    const request = new sql.Request();
    request
      .input("cardId", sql.Char(7), cardId)
      .input("cardStatus", sql.NVarChar(20), cardStatus).query(`
        UPDATE MEMBERSHIP_CARD
        SET CARD_STATUS = @cardStatus
        WHERE CARD_ID = @cardId
        `);
    res.redirect(`/branch/${branchId}/customer-card`);
  } catch (error) {
    console.error("Error updating customer card:", error);

    // Trả về trang báo lỗi với thông điệp chi tiết hơn
    res.status(500).send("Có lỗi xảy ra khi cập nhật thẻ khách hàng.");
  }
};
