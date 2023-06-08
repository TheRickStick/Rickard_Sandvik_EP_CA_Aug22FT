const jwt = require('jsonwebtoken');
const db = require('../models/db');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    req.user = null;
    req.isAdmin = false;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      req.user = null;
      req.isAdmin = false;
      return next();
    }

    try {
      const user = await db.User.findByPk(decodedToken.id, { include: [db.Cart, db.Role] });
      
      if (!user || !user.Role) {
        req.user = null;
        req.isAdmin = false;
        return next();
      }

      req.user = user;
      req.isAdmin = (user.Role.name === 'Admin');

      next(); 
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });
}

module.exports = authenticateToken;
