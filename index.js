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

app.get("/dat-ban", (req, res) => {
  res.render("table_booking", { activePage: "table_booking" });
});

app.get("/menu", (req, res) => {
  res.render("menu", { activePage: "menu" });
});

app.listen(port, () => {
  console.log(`Project dang chay o port ${port}`);
});
