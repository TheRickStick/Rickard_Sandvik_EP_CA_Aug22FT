var isAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Only admin can perform this action" });
  }
  next();
};

module.exports = isAdmin;