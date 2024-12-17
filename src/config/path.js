export const PATH = {
  HOME: "/",
  CUSTOMER: {
    TABLE_BOOKING: "/table-booking",
    MENU: "/menu",
    CART: "/cart",
    TABLE_BOOKING_PREORDER: "/table-booking/pre-order",
  },
  BRANCH: {
    HOME: "/branch/:branchId",
    EMPLOYEE_LIST: "/branch/:branchId/employee-list",
    EMPLOYEE_SEARCH: "/branch/:branchId/employee-search",
    ORDER: "/branch/:branchId/order-form",
    INVOICE: "/branch/:branchId/invoice",
    CUSTOMER_CARD: "/customer-card",
  },
  COMPANY: {
    PATH: "/company",
    FOOD_REVENUE: "/food-revenue",
    RESOURCE: "/resource",
    RESOURCE_TRANSFER: "/resource/transfer/:employeeId",
    RESOURCE_UPDATE: "/resource/update/:employeeId",
    UPDATE_SALARY: "/update-salary",
  },
  EMPLOYEE: {
    PATH: "/employee",
  },
  AUTHENTICATION: {
    LOGIN: "/login",
    REGISTER: "/register",
  },
};
