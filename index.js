//index.js
const express = require("express");
const app = express();
const port = 3000;
const menuData = {
  appetizers: [
    { name: "Salad rau mùa sốt", price: 68000, originalPrice: 70000, imageUrl: "https://bizweb.dktcdn.net/thumb/large/100/469/097/products/untitled1-1.jpg?v=1667882668260", discount: 3 },
    { name: "Phở cuốn", price: 55000, originalPrice: 60000, imageUrl: "https://bizweb.dktcdn.net/thumb/large/100/469/097/products/untitled1f119f567b16045a78f61d.jpg?v=1667882617523", discount: 8 },
  ],
  mainCourses: [
    { name: "Ba rọi nướng riềng mẻ", price: 120000, originalPrice: 150000, imageUrl: "https://bizweb.dktcdn.net/thumb/large/100/469/097/products/1240f05c5ee174bcdaf47d5ec33197.jpg?v=1667882506833", discount: 20 },
    { name: "Ba rọi chiên mắm ngò", price: 90000, originalPrice: 100000, imageUrl: "https://bizweb.dktcdn.net/thumb/large/100/469/097/products/17ad3f36d9db047aa93f83dc10abc6.jpg?v=1667882482780", discount: 10 },
  ],
  soups: [
    { name: "Bún bò", price: 70000, originalPrice: 80000, imageUrl: "https://bizweb.dktcdn.net/thumb/large/100/469/097/products/12544e4d15a994948a261d455eee51.jpg?v=1667882376433", discount: 5 },
  ],
};
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("customer/home", { activePage: "home", menuData }); // Thêm menuData vào đây
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
  res.render("customer/table_booking", { activePage: "table_booking", menuData });
});

app.get('/menu', (req, res) => {
  res.render('customer/menu', { activePage: "menu", menuData }); // Đường dẫn đúng đến file menu.ejs
});
app.get("/cart", (req, res) => {
  res.render("cart", { activePage: "cart" });
});
app.get("/dat-ban/dat-truoc", (req, res) => {
  res.render("customer/orderMenu", { activePage: "orderMenu", menuData });
});
app.listen(port, () => {
  console.log(`Project dang chay o port ${port}`);
});
