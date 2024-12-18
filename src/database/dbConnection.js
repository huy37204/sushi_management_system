import sql from "mssql";

const config = {
  user: "huy",
  password: "1234",
  server: "localhost",
  database: "SUSUSHISHI",
  options: {
    encrypt: false, // Tắt mã hóa SSL
    trustServerCertificate: true, // Chỉ dùng trong môi trường phát triển
    enableArithAbort: true,
    trustedConnection: false,
    instancename: "MSSQLSERVER",
  },
  port: 1433,
};

const connect = async () => {
  try {
    const pool = await sql.connect(config);
    console.log("Kết nối thành công!");
    return pool;
  } catch (err) {
    console.error("Lỗi khi kết nối cơ sở dữ liệu:", err);
    if (err.code) {
      console.error("Mã lỗi:", err.code);
    }
    throw err;
  }
};

export { connect, sql };
