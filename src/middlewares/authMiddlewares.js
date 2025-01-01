export const verifyRole = (roles = []) => {
  return (req, res, next) => {
    try {
      // Kiểm tra user và role
      const role = req.user?.role || "Khách hàng";
      if (roles.includes(role)) {
        return next();
      }

      // Phản hồi lỗi truy cập
      res.status(403).json({
        message: "Bạn không có quyền truy cập vào trang này",
        requiredRoles: roles,
        userRole: role,
      });
    } catch (error) {
      console.error("Error in verifyRole middleware:", error.message);
      res.status(500).json({ message: "Đã xảy ra lỗi trên máy chủ" });
    }
  };
};
