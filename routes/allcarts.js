const express = require('express');
const router = express.Router();
const db = require('../models/db');
const authenticateToken = require('../middleware/authenticateToken');

// GET /allcarts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Only allow Admin user to access this endpoint
    if (user.Role.name !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Retrieve all carts with user and item information
    const carts = await db.Cart.findAll({
      include: [{ model: db.User, attributes: ['firstName', 'lastName'] }, { model: db.Item }],
    });

    res.json(carts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
