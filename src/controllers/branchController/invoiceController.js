import { sql } from "../../database/dbConnection.js";

export const branchInvoiceController = async (req, res) => {
  const { branchId } = req.params;
  const user = req.user;

  res.render("branch/branch_invoice", {
    branchId,
    user,
    invoices: [],
  });
};

export const getInvoice = async (req, res) => {
  const { branchId } = req.params;
  const { customerPhone, invoiceDate } = req.body;

  try {
    // Kiểm tra nếu cả customerPhone và invoiceDate đều là null
    if (!customerPhone && !invoiceDate) {
      return res.render("branch/branch_invoice", {
        branchId,
        user: req.user,
        invoices: [],
      });
    }

    const request = new sql.Request();

    // Sử dụng input để tránh SQL Injection
    request.input("CUSTOMER_PHONE", sql.VarChar(15), customerPhone || null);
    request.input("DATE", sql.Date, invoiceDate || null);

    // Thực thi thủ tục SQL
    const result = await request.execute("getInvoiceByPhone");

    // Phân tách dữ liệu từ kết quả
    const invoices = result.recordsets[0]; // Danh sách hóa đơn
    const dishes = result.recordsets[1]; // Danh sách món ăn

    // Tạo cấu trúc dữ liệu phản hồi
    const response = invoices.map((invoice) => {
      return {
        ...invoice,
        dishes: dishes.filter((dish) => dish.INVOICE_ID === invoice.INVOICE_ID),
      };
    });

    // Trả về dữ liệu JSON
    res.render("branch/branch_invoice", {
      branchId,
      user: req.user,
      invoices: response,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).send("Error fetching invoice data.");
  }
};
