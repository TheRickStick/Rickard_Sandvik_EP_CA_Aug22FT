var express = require('express');
var router = express.Router();
var db = require('../models/db');

// GET /items
router.get('/', async (req, res) => {
  try {
    const { User } = req;
    const items = await db.Item.findAll({ include: db.Category });

    // Filter items based on user type
    const filteredItems = User ? items : items.filter(item => item.stock > 0);

    res.json(filteredItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
