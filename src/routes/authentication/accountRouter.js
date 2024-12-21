import { PATH } from "../../config/path.js";
import {
  loginController,
  registerUser,
  updateSessionHistory,
} from "../../controllers/authentication/accountController.js";

import express from "express";

const accountRouter = express.Router();

accountRouter
  .post(PATH.AUTHENTICATION.LOGIN, loginController)
  .get(PATH.AUTHENTICATION.LOGIN, (req, res) => {
    res.render("signin");
  });

accountRouter.get("/logout", async (req, res) => {
  try {
    if (req.user.startTime) {
      // Update session duration before logging out
      await updateSessionHistory(req, res);
    }

    // Clear session and cookies
    req.user.startTime = null;
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("There was an error during logout.");
      }

      // Clear cookies
      res.clearCookie("connect.sid", { path: "/" });
      res.clearCookie("userInfo", { path: "/" });

      // Redirect to login page
      res.redirect("/login");
    });
  } catch (error) {
    console.error("Error while logging out:", error);
    res.status(500).send("There was an error while logging out.");
  }
});

accountRouter
  .post(PATH.AUTHENTICATION.REGISTER, registerUser)
  .get(PATH.AUTHENTICATION.REGISTER, (req, res) => {
    res.render("register");
  });
export default accountRouter;
