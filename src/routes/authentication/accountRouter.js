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
  // Xóa user khỏi session
  req.session.user = null;

  // Xóa user khỏi req
  req.user = null;

  // Destroy session hoàn toàn nếu cần
  req.session.destroy((err) => {
    if (err) {
      console.error("Lỗi khi hủy session:", err);
      return res.status(500).send("Có lỗi xảy ra khi đăng xuất.");
    }
    res.redirect("/login");
  });
});

accountRouter
  .post(PATH.AUTHENTICATION.REGISTER, registerUser)
  .get(PATH.AUTHENTICATION.REGISTER, (req, res) => {
    res.render("register");
  });
export default accountRouter;
