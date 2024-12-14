import { PATH } from "../../config/path.js";
import {
  loginController,
  registerUser,
} from "../../controllers/authentication/accountController.js";

import express from "express";

const accountRouter = express.Router();

accountRouter
  .post(PATH.AUTHENTICATION.LOGIN, loginController)
  .get(PATH.AUTHENTICATION.LOGIN, (req, res) => {
    res.render("signin");
  });

accountRouter.get("/logout", (req, res) => {
  req.session.user = null;

  req.session.destroy((err) => {
    if (err) {
      console.error("Lỗi khi hủy session:", err);
      return res.status(500).send("Có lỗi xảy ra khi đăng xuất.");
    }

    // Xóa cookie với đúng domain và path, nếu có
    res.clearCookie("connect.sid", {
      path: "/", // Chỉ định đường dẫn nếu cần (thường là "/")
    });
    res.clearCookie("userInfo", {
      path: "/", // Chỉ định đường dẫn nếu cần (thường là "/")
    });

    // Chuyển hướng đến trang login
    res.redirect("/login");
  });
});

accountRouter
  .post(PATH.AUTHENTICATION.REGISTER, registerUser)
  .get(PATH.AUTHENTICATION.REGISTER, (req, res) => {
    res.render("register");
  });
export default accountRouter;
