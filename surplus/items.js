var express = require('express');
var router = express.Router();
var db = require('../models/db');
var authenticateToken = require('../middleware/authenticateToken'); 

// GET /items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user } = req; 

    // Retrieve items with their categories
    const items = await db.Item.findAll({
      attributes: ['name', 'price', 'stock'], 
      include: db.Category 
    });

    // Filter items 
    const filteredItems = items.filter(item => {
      if (!user) {
        // Guest user
        return item.stock > 0;
      }

      // Logged-in user
      return true;
    });

    res.json(filteredItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

