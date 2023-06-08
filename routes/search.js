const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { Op } = require('sequelize');

// POST /search
router.post('/', async (req, res) => {
  try {
    const { itemName, categoryName, sku } = req.body;
  
    let searchOptions = {};
  
    if (itemName) {
      searchOptions.name = { [Op.like]: `%${itemName}%` };
    }
  
    if (categoryName) {
      searchOptions['$Category.name$'] = { [Op.like]: `%${categoryName}%` };
    }
  
    if (sku) {
      searchOptions.sku = sku;
    }
  
    const items = await db.Item.findAll({
      where: searchOptions,
      include: [{ model: db.Category }],
    });
  
    res.json({ items: items });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
