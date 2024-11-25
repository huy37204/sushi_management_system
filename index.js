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

app.get("/branch-home", (req, res) => {
  res.render("branch_home");
});

app.get("/branch-employee-list", (req, res) => {
  res.render("branch_employee_list");
});

app.get("/branch-employee-search", (req, res) => {
  res.render("branch_employee_search");
});

app.get("/branch-order-form", (req, res) => {
  res.render("branch_order_form");
});

app.get("/branch-invoice", (req, res) => {
  res.render("branch_invoice");
});

app.get("/branch-customer-card", (req, res) => {
  res.render("branch_customer_card");
});

app.get("/dat-ban", (req, res) => {
  res.render("table_booking", { activePage: "table_booking" });
});

app.get("/menu", (req, res) => {
  res.render("menu", { activePage: "menu" });
});

app.listen(port, () => {
  console.log(`Project dang chay o port ${port}`);
});

console.log("a");
