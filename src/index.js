import { PATH } from "./config/path.js";
import express from "express";
import router from "./routes/index.js";
import { fileURLToPath } from "url";
import path from "path";
import { connect, sql } from "./database/dbConnection.js";
import dotenv from "dotenv";
import session from "express-session";
import { hashAllPasswords } from "./controllers/hashPassword/hashPassword.js";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SECRET_KEY, // SECRET_KEY từ .env
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // Cookie hết hạn sau 7 ngày
      httpOnly: true, // Ngăn truy cập cookie từ client-side JavaScript
    },
  }),
);
const connectToDatabase = async () => {
  try {
    const pool = await connect();
    console.log("Kết nối SQL Server thành công!");
  } catch (err) {
    console.error("Lỗi khi kết nối cơ sở dữ liệu:", err);
  }
};

// Kết nối với database
connectToDatabase();

hashAllPasswords().catch((err) =>
  console.error("Lỗi trong quá trình hash:", err),
);

// Middleware để parse body request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware để gán user từ session vào req
app.use((req, res, next) => {
  if (req.session.user) {
    req.user = req.session.user;
  } else if (req.cookies && req.cookies.userInfo) {
    req.user = JSON.parse(req.cookies.userInfo);
    req.session.user = JSON.parse(req.cookies.userInfo);
  }
  next();
});

app.use(router);

app.listen(port, () => {
  console.log(`Project dang chay o port ${port}`);
});
sql.on("error", (err) => {
  console.error("SQL Error:", err);
});
