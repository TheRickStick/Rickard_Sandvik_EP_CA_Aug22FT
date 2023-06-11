const express = require('express');
const router = express.Router();
const db = require('../models/db');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');

//POST /category
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const category = await db.Category.create({ name });
    res.status(201).json({ message: "Category created successfully", category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /category/:id
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const category = await db.Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    await category.update({ name: req.body.name });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//DELETE /category/:id
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
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
