//index.js
const express = require("express");
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home", { activePage: "home" });
});
app.get("/signin", (req, res) => {
  res.render("signin", { activePage: "signin" });
});

app.get("/branch-home", (req, res) => {
  res.render("branch_home");
});

app.get("/branch-employee-list", (req, res) => {
  res.render("branch_employee_list");
});

app.get("/dat-ban", (req, res) => {
  res.render("table_booking", { activePage: "table_booking" });
});

app.get("/menu", (req, res) => {
  res.render("menu", { activePage: "menu" });
});
app.get("/cart", (req, res) => {
  res.render("cart", { activePage: "cart" });
});
app.listen(port, () => {
  console.log(`Project dang chay o port ${port}`);
});
