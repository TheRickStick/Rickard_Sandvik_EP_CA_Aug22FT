var express = require('express');
var router = express.Router();
var db = require('../models/db');
var { Op } = require('sequelize');
var authenticateToken = require('../middleware/authenticateToken'); 

// POST /search
router.post('/', async (req, res) => {
    try {
      const { itemName, categoryName, sku } = req.body;
  
      let searchOptions = {};
  
      if (itemName) {
        searchOptions.name = { [Op.like]: `%${itemName}%` };
      }
  
      if (categoryName) {
        searchOptions['$Category.name$'] = categoryName;
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
