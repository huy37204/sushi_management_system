//index.js
const express = require("express");
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("customer/home", { activePage: "home" });
});
app.get("/signin", (req, res) => {
  res.render("signin", { activePage: "signin" });
});

app.get("/branch-home", (req, res) => {
  res.render("branch/branch_home");
});

app.get("/branch-employee-list", (req, res) => {
  res.render("branch/branch_employee_list");
});

app.get("/branch-employee-search", (req, res) => {
  res.render("branch/branch_employee_search");
});

app.get("/branch-order-form", (req, res) => {
  res.render("branch/branch_order_form");
});

app.get("/branch-invoice", (req, res) => {
  res.render("branch/branch_invoice");
});

app.get("/branch-customer-card", (req, res) => {
  res.render("branch/branch_customer_card");
});

app.get("/company-home", (req, res) => {
  res.render("company/company_home");
});

app.get("/company-food-revenue", (req, res) => {
  res.render("company/company_food_revenue");
});

app.get("/dat-ban", (req, res) => {
  res.render("customer/table_booking", { activePage: "table_booking" });
});

app.get("/menu", (req, res) => {
  res.render("customer/menu", { activePage: "menu" });
});
app.get("/cart", (req, res) => {
  res.render("cart", { activePage: "cart" });
});
app.listen(port, () => {
  console.log(`Project dang chay o port ${port}`);
});
