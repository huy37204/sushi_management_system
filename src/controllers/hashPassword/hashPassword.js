import bcrypt from "bcrypt";
import { sql, connect } from "../../database/dbConnection.js";
const bcryptRegex = /^\$2[ab]\$.{56}$/;

export const hashAllPasswords = async () => {
  const pool = await connect();

  try {
    // Lấy tất cả các tài khoản (bao gồm ID và PASSWORD chưa hash)
    const result = await pool.request().query(
      `SELECT ACCOUNT_ID, PASSWORD FROM account`
    );
    const accounts = result.recordset;

    for (const account of accounts) {
      // Kiểm tra xem mật khẩu đã được hash hay chưa
      if (bcryptRegex.test(account.PASSWORD)) {
        continue;
      } else {
        // Nếu mật khẩu chưa được hash, tiến hành hash
        const hashedPassword = await bcrypt.hash(account.PASSWORD, 10);

        // Tạo một request mới cho mỗi tài khoản
        const request = pool.request();

        // Cập nhật lại mật khẩu đã hash vào database
        await request
          .input("accountId", sql.VarChar, account.ACCOUNT_ID)
          .input("hashedPassword", sql.VarChar, hashedPassword)
          .query(
            `UPDATE ACCOUNT SET PASSWORD = @hashedPassword WHERE ACCOUNT_ID = @accountId`
          );

        console.log(
          `Mật khẩu cho tài khoản ${account.ACCOUNT_ID} đã được hash.`
        );
      }
    }

    console.log("Tất cả mật khẩu đã được hash thành công!");
  } catch (error) {
    console.error("Lỗi khi hash mật khẩu:", error);
  }
};
