import sql from "mssql";

const config = {
  user: "HUY",
  password: "1234",
  server: "X1-CARBON",
  database: "SUSUSHISHI",
  options: {
    encrypt: false, // Tắt mã hóa SSL
    trustServerCertificate: true, // Chỉ dùng trong môi trường phát triển
    enableArithAbort: true,
    trustedConnection: false,
    instancename: "MSSQLSERVER",
  },
  port: 1433,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000, // Thời gian chờ khi idle
  },
  requestTimeout: 30000, // Thời gian chờ tối đa cho mỗi request
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
