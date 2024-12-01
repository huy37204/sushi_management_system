export const verifyRole = (roles) => {
  return (req, res, next) => {
    if (req.session.user && roles.includes(req.session.user.role)) {
      next();
    } else {
      res.status(403).send("Bạn không có quyền truy cập vào trang này");
    }
  };
};
