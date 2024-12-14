import sql from "mssql";

const config = {
  user: "huy",
  password: "1234",
  server: "localhost",
  database: "SUSUSHISHI",
  options: {
    trustServerCertificate: true,
    trustedConnection: false,
    enableArithAbort: true,
    instancename: "SQLEXPRESS",
  },
  port: 1433,
};

const connect = async () => {
  try {
    const pool = await sql.connect(config);
    return pool; // Trả về pool kết nối
  } catch (err) {
    console.error("Lỗi khi kết nối cơ sở dữ liệu:", err);
    throw err; // Quăng lỗi để xử lý bên ngoài
  }
};

export { connect, sql };
