import { PATH } from "./config/path.js";
import express from "express";
import router from "./routes/index.js";
import { fileURLToPath } from "url";
import path from "path";
import { connect } from "./database/dbConnection.js";
import dotenv from "dotenv";
import session from "express-session";

dotenv.config();

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SECRET_KEY, // Lấy SECRET_KEY từ .env
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // secure: true chỉ dùng khi sử dụng HTTPS
  })
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

// Middleware để parse body request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(router);

app.listen(port, () => {
  console.log(`Project dang chay o port ${port}`);
});
