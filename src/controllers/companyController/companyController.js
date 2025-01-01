import { sql, connect } from "../../database/dbConnection.js";
export const companyController = async (req, res) => {
  const { branchId } = req.query;
  const user = req.user;
  const request = new sql.Request();

  // Thực hiện truy vấn lấy thông tin BranchId
  try {
    const result = await request.query(`
        SELECT B.BRANCH_ID, B.BRANCH_NAME
        FROM RESTAURANT_BRANCH B
      `);

    // Kiểm tra nếu recordset trả về có kết quả
    if (result.recordset.length > 0) {
      const branches = result.recordset; // Truyền giá trị BRANCH_ID

      // Render dữ liệu
      res.render("company/company_home", {
        branchId: branchId || null,
        user: user,
        branches,
        type: "",
        invoices: [],
        hourlyTotals: [],
        dailyTotals: [],
        monthlyTotals: [],
        quarter: "",
      });
    } else {
      // Nếu không tìm thấy BranchId cho manager, trả về lỗi hoặc chuyển hướng
      res.status(404).send("Branch not found for the given manager.");
    }
  } catch (error) {
    console.error("Error fetching branch details:", error);
    res.status(500).send("Internal server error.");
  }
};

export const getCompanyRevenueByDate = async (req, res) => {
  try {
    const { selectDate, branchId } = req.body;

    const request = new sql.Request();
    request.input("DATE", sql.Date, selectDate);
    request.input("BranchId", sql.Char(4), branchId);

    // Gọi stored procedure để lấy invoices
    const invoiceResult = await request.execute("getRevenueByDate");

    const invoices = invoiceResult.recordset;

    // Khởi tạo mảng tổng FINAL_AMOUNT theo các khoảng thời gian
    const hourlyTotals = Array(8).fill(0); // 8 khoảng: 0-3, 3-6, ..., 21-24

    invoices.forEach((invoice) => {
      let hour;

      // Kiểm tra và chuyển đổi ISSUE_TIME
      if (invoice.ISSUE_TIME instanceof Date) {
        // Nếu ISSUE_TIME là kiểu Date, lấy giờ bằng getHours()
        hour = invoice.ISSUE_TIME.getHours();
      } else if (typeof invoice.ISSUE_TIME === "string") {
        // Nếu ISSUE_TIME là chuỗi, dùng split để lấy giờ
        [hour] = invoice.ISSUE_TIME.split(":").map(Number);
      } else {
        // Nếu ISSUE_TIME không hợp lệ, bỏ qua hóa đơn này
        console.error(`Invalid ISSUE_TIME: ${invoice.ISSUE_TIME}`);
        return;
      }

      const index = Math.floor(hour / 3); // Xác định khoảng thời gian
      if (index < hourlyTotals.length) {
        hourlyTotals[index] += invoice.FINAL_AMOUNT; // Cộng dồn FINAL_AMOUNT vào khoảng tương ứng
      }
    });

    const result = await request.query(`
        SELECT B.BRANCH_ID, B.BRANCH_NAME
        FROM RESTAURANT_BRANCH B
      `);
    const branches = result.recordset;
    // Render ra view branch_home với dữ liệu
    res.render("company/company_home", {
      branches,
      branchId,
      invoices,
      type: "date-revenue",
      hourlyTotals: hourlyTotals,
      dailyTotals: [],
      monthlyTotals: [],
      quarter: "",
    });
  } catch (error) {
    console.error("Error fetching branch company by date:", error);
    res.status(500).send("Error fetching company revenue by date");
  }
};

export const getCompanyRevenueByMonth = async (req, res) => {
  try {
    const { year, month, branchId } = req.body;

    const request = new sql.Request();
    request.input("Year", sql.Int, year);
    request.input("Month", sql.Int, month);
    request.input("BranchId", sql.Char(4), branchId);

    const invoiceResult = await request.execute("getRevenueByMonth");
    const invoices = invoiceResult.recordset;

    const daysInMonth = new Date(year, month, 0).getDate(); // Số ngày của tháng (tháng 0-based)

    // Khởi tạo dailyTotals với giá trị 0
    const dailyTotals = new Array(daysInMonth).fill(0);

    invoices.forEach((invoice) => {
      // Chuyển đổi ISSUE_DATE thành đối tượng Date
      const invoiceDate = new Date(invoice.ISSUE_DATE);

      // Kiểm tra nếu invoiceDate là hợp lệ
      if (!isNaN(invoiceDate)) {
        const day = new Date(invoice.ISSUE_DATE).getUTCDate(); // Lấy ngày (1-31)
        dailyTotals[day - 1] += parseFloat(invoice.FINAL_AMOUNT || 0); // Cộng giá trị hóa đơn vào ngày tương ứng
      } else {
        console.warn(`Invalid date found in invoice: ${invoice.ISSUE_DATE}`);
      }
    });
    const result = await request.query(`
        SELECT B.BRANCH_ID, B.BRANCH_NAME
        FROM RESTAURANT_BRANCH B
      `);
    const branches = result.recordset;

    // Trả về trang kết quả
    res.render("company/company_home", {
      branches,
      branchId,
      invoices,
      type: "month-revenue",
      dailyTotals,
      hourlyTotals: [],
      monthlyTotals: [],
      quarter: "",
    });
  } catch (error) {
    console.error("Error fetching branch revenue by month:", error);
    res.status(500).send("Error fetching branch revenue by month");
  }
};

export const getCompanyRevenueByQuarter = async (req, res) => {
  try {
    const { year, quarter, branchId } = req.body;

    const request = new sql.Request();
    request.input("Year", sql.Int, year);
    request.input("Quarter", sql.Int, quarter);
    request.input("BranchId", sql.Char(4), branchId);

    const invoiceResult = await request.execute("getRevenueByQuarter");
    const invoices = invoiceResult.recordset;

    // Xác định tháng trong quý (1, 2, 3 cho Quý 1; 4, 5, 6 cho Quý 2; v.v.)
    let monthsInQuarter = [];
    if (quarter === "1") {
      monthsInQuarter = [1, 2, 3]; // Quý 1: Tháng 1, 2, 3
    } else if (quarter === "2") {
      monthsInQuarter = [4, 5, 6]; // Quý 2: Tháng 4, 5, 6
    } else if (quarter === "3") {
      monthsInQuarter = [7, 8, 9]; // Quý 3: Tháng 7, 8, 9
    } else if (quarter === "4") {
      monthsInQuarter = [10, 11, 12]; // Quý 4: Tháng 10, 11, 12
    }

    // Khởi tạo monthlyTotals với giá trị 0 cho mỗi tháng trong quý
    const monthlyTotals = [0, 0, 0];

    invoices.forEach((invoice) => {
      // Chuyển đổi ISSUE_DATE thành đối tượng Date
      const invoiceDate = new Date(invoice.ISSUE_DATE);

      // Kiểm tra nếu invoiceDate là hợp lệ
      if (!isNaN(invoiceDate)) {
        const month = invoiceDate.getMonth() + 1; // Lấy tháng (1-12)
        if (monthsInQuarter.includes(month)) {
          const monthIndex = monthsInQuarter.indexOf(month);
          monthlyTotals[monthIndex] += parseFloat(invoice.FINAL_AMOUNT || 0);
        }
      } else {
        console.warn(`Invalid date found in invoice: ${invoice.ISSUE_DATE}`);
      }
    });
    const result = await request.query(`
        SELECT B.BRANCH_ID, B.BRANCH_NAME
        FROM RESTAURANT_BRANCH B
      `);
    const branches = result.recordset;

    res.render("company/company_home", {
      branches,
      branchId,
      invoices,
      type: "quarter-revenue",
      quarter,
      monthlyTotals,
      dailyTotals: [],
      hourlyTotals: [],
    });
  } catch (error) {
    console.error("Error fetching branch revenue by quarter:", error);
    res.status(500).send("Error fetching branch revenue by quarter");
  }
};

export const getCompanyRevenueByYear = async (req, res) => {
  try {
    const { year, branchId } = req.body;

    const request = new sql.Request();
    request.input("Year", sql.Int, year);
    request.input("BranchId", sql.Char(4), branchId);
    const invoiceResult = await request.execute("getRevenueByYear");
    const invoices = invoiceResult.recordset;
    const monthlyTotals = Array(12).fill(0);

    // Lặp qua tất cả các hóa đơn và cộng tổng doanh thu vào tháng tương ứng
    invoices.forEach((invoice) => {
      // Chuyển đổi ISSUE_DATE thành đối tượng Date
      const invoiceDate = new Date(invoice.ISSUE_DATE);

      // Kiểm tra nếu invoiceDate là hợp lệ
      if (!isNaN(invoiceDate)) {
        const month = invoiceDate.getMonth(); // Lấy tháng (0-11, nên không cần +1)

        monthlyTotals[month] += parseFloat(invoice.FINAL_AMOUNT || 0);
      }
    });

    const result = await request.query(`
        SELECT B.BRANCH_ID, B.BRANCH_NAME
        FROM RESTAURANT_BRANCH B
      `);
    const branches = result.recordset;
    res.render("company/company_home", {
      branches,
      branchId,
      invoices,
      type: "year-revenue",
      quarter: "",
      monthlyTotals,
      dailyTotals: [],
      hourlyTotals: [],
    });
  } catch (error) {
    console.error("Error fetching branch revenue by year:", error);
    res.status(500).send("Error fetching branch revenue by year");
  }
};
