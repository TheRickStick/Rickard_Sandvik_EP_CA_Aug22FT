var express = require('express');
var router = express.Router();
var db = require('../models/db');
var authenticateToken = require('../middleware/authenticateToken'); 

// GET /items
router.get('/', async (req, res) => {
  try {
    const items = await db.Item.findAll({ include: db.Category });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /item
router.post('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log('User:', user); 

    if (user.Role.name !== 'Admin') {
      return res.status(403).json({ message: "Only admin can add an item" });
    }

    console.log('Request Body:', req.body);

    const { name, sku, price, stock, categoryId } = req.body;

    const category = await db.Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const newItem = await db.Item.create({
      name,
      sku,
      price,
      stock,
      CategoryId: category.id
    });

    console.log('Created Item:', newItem); 

    res.status(201).json(newItem);
  } catch (err) {
    console.log(err); 
    res.status(500).json({ message: err.message });
  }
});

// PUT /item/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.Role.name !== 'Admin') {
      return res.status(403).json({ message: "Only admin can update an item" });
    }

    const itemId = req.params.id;
    const { name, sku, price, stock, categoryId } = req.body;

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
      CategoryId: category.id
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /item/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.Role.name !== 'Admin') {
      return res.status(403).json({ message: "Only admin can delete an item" });
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
