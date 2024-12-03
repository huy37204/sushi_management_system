import { PATH } from "../../config/path.js";
import express from "express";
import { verifyRole } from "../../middlewares/authMiddlewares.js";

const employeeRouter = express.Router();

employeeRouter.get(
  PATH.HOME,
  verifyRole(["Thu ngân", "Lễ tân"]),
  (req, res) => {
    res.render("employee/employee_home");
  },
);

export default employeeRouter;
