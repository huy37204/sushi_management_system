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
    CUSTOMER_CARD: "/branch/:branchId/customer-card",
  },
  COMPANY: {
    HOME: "/company",
    FOOD_REVENUE: "/company/food-revenue",
    RESOURCE: "/company/resource",
    RESOURCE_TRANSFER: "/company/resource/transfer",
    RESOURCE_UPDATE: "/company/resource/update",
    UPDATE_SALARY: "/company/update-salary",
  },
  EMPLOYEE: {
    PATH: "/employee",
  },
  AUTHENTICATION: {
    LOGIN: "/login",
    REGISTER: "/register",
  },
};
