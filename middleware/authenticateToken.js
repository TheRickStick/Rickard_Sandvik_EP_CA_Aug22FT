const jwt = require('jsonwebtoken');
const db = require('../models/db');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    // Guest user
    req.user = null;
    return next();
  }
  console.log('Auth Header:', authHeader);

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    console.log('Decoded Token:', decodedToken);
    if (err) return res.sendStatus(403);

    try {
      const user = await db.User.findByPk(decodedToken.id, { include: [db.Cart, db.Role] });
      if (!user || !user.Role) return res.sendStatus(403);

      req.user = user;
      if (user.Role.name === 'Admin') {
        req.isAdmin = true;
      }

      next(); 
    } catch (err) {
      console.log('Error:', err);
      res.status(500).json({ message: err.message });
    }
  });
}

module.exports = authenticateToken;