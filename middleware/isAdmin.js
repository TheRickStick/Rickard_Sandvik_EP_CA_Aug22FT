const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    req.isAdmin = true;
    next();
  } else {
    req.isAdmin = false;
    next();
  }
};

module.exports = isAdmin;