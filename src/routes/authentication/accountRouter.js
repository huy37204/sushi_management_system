import { PATH } from "../../config/path.js";
import { loginController } from "../../controllers/authentication/accountController.js";

import express from "express";

const accountRouter = express.Router();

accountRouter
  .post(PATH.AUTHENTICATION.LOGIN, loginController)
  .get(PATH.AUTHENTICATION.LOGIN, (req, res) => {
    res.render("signin", { activePage: "signin" });
  });
export default accountRouter;
