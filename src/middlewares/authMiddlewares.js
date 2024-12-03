export const verifyRole = (roles) => {
  return (req, res, next) => {
    const role = req.user ? req.user.role : "Khách hàng";
    if (roles.includes(role)) {
      next();
    } else {
      res.status(403).send("Bạn không có quyền truy cập vào trang này");
    }
  };
};
