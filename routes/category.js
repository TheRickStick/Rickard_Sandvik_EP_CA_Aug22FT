var express = require('express');
var router = express.Router();
var db = require('../models/db');
var authenticateToken = require('../middleware/authenticateToken'); 

  
  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.Role.name !== 'Admin') {
        return res.status(403).json({ message: "Only admin can update a category" });
      }
  
      const category = await db.Category.findByPk(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
  
      await category.update({ name: req.body.name });
      res.json(category);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.Role.name !== 'Admin') {
        return res.status(403).json({ message: "Only admin can delete a category" });
      }
  
      const category = await db.Category.findByPk(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
  
      if (await category.countItems()) {
        return res.status(400).json({ message: "Category has items. Can't be deleted." });
      }
  
      await category.destroy();
      res.json({ message: "Category deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  module.exports = router;