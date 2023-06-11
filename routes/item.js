const express = require('express');
const router = express.Router();
const db = require('../models/db');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin'); 

// POST /item
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (req.authError) {
      return res.status(401).json({ message: req.authError });
    }

    const { name, sku, price, stock, img_url, categoryId } = req.body;

    if (!name || !sku || price === undefined || stock === undefined || !img_url || !categoryId) {
      return res.status(400).json({ message: "All fields are required: name, sku, price, stock, img_url, categoryId" });
    }

    const category = await db.Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const newItem = await db.Item.create({
      name,
      sku,
      price,
      stock,
      img_url,
      CategoryId: category.id
    });

    res.status(201).json({
      message: 'Item created successfully',
      item: newItem
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /item/:id
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (req.authError) {
      return res.status(401).json({ message: req.authError });
    }

    const itemId = req.params.id;
    const { name, sku, price, stock, img_url, categoryId } = req.body;
    
    if (!name || !sku || price === undefined || stock === undefined || !img_url || !categoryId) {
      return res.status(400).json({ message: "All fields are required: name, sku, price, stock, img_url, categoryId" });
    }

    const item = await db.Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const category = await db.Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await item.update({
      name,
      sku,
      price,
      stock,
      img_url,
      CategoryId: category.id
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /item/:id
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (req.authError) {
      return res.status(401).json({ message: req.authError });
    }

    const itemId = req.params.id;

    const item = await db.Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.destroy();

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
