import { sql } from "../../database/dbConnection.js";

export const getMenuDropDownItem = async () => {
  try {
    const request = new sql.Request();
    const result = await request.execute("getMenuDropDownItem");

    // Trả về kết quả
    return result.recordset;
  } catch (err) {
    console.error("Lỗi khi gọi thủ tục getMenuDropDownItem:", err);
    throw new Error("Lỗi khi lấy dữ liệu menu");
  }
};
