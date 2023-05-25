var express = require('express');
var router = express.Router();
var db = require('../models/db');
var authenticateToken = require('../middleware/authenticateToken'); 


router.get('/', async (req, res) => {
    try {
      const categories = await db.Category.findAll();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  

  module.exports = router;
