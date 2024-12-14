import bcrypt from "bcrypt";
import { sql, connect } from "../../database/dbConnection.js";
const bcryptRegex = /^\$2[ab]\$.{56}$/;

export const hashAllPasswords = async () => {
  const pool = await connect();
  const request = new sql.Request(pool);

  try {
    // Lấy tất cả các tài khoản (bao gồm ID và PASSWORD chưa hash)
    const result = await request.query(
      `SELECT ACCOUNT_ID, PASSWORD FROM account`,
    );
    const accounts = result.recordset;

    for (const account of accounts) {
      // Kiểm tra xem mật khẩu đã được hash hay chưa
      if (bcryptRegex.test(account.PASSWORD)) {
        continue;
      } else {
        // Nếu mật khẩu chưa được hash, tiến hành hash
        const hashedPassword = await bcrypt.hash(account.PASSWORD, 10);

        // Đặt tên tham số duy nhất cho mỗi tài khoản
        const accountIdParam = `accountId_${account.ACCOUNT_ID}`;
        const hashedPasswordParam = `hashedPassword_${account.ACCOUNT_ID}`;

        // Cập nhật lại mật khẩu đã hash vào database
        await request
          .input(accountIdParam, sql.VarChar, account.ACCOUNT_ID) // Tên tham số duy nhất
          .input(hashedPasswordParam, sql.VarChar, hashedPassword)
          .query(
            `UPDATE ACCOUNT SET PASSWORD = @${hashedPasswordParam} WHERE ACCOUNT_ID = @${accountIdParam}`,
          );

        console.log(
          `Mật khẩu cho tài khoản ${account.ACCOUNT_ID} đã được hash.`,
        );
      }
    }

    console.log("Tất cả mật khẩu đã được hash thành công!");
  } catch (error) {
    console.error("Lỗi khi hash mật khẩu:", error);
  }
};
