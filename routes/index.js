const express = require('express');
const router = express.Router();
const db = require('../models/db');
const authenticateToken = require('../middleware/authenticateToken');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// GET /allcarts
router.get('/allcarts', authenticateToken, async (req, res) => {
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

router.get('/categories', async (req, res) => {
  try {
    const categories = await db.Category.findAll();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /items
router.get('/items', authenticateToken, async (req, res) => {
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

// Fetch orders for the logged-in user
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    const orders = await db.Order.findAll({
      where: { UserId: user.id },
      include: [
        { model: db.User, attributes: ['firstName', 'lastName'] },
        { model: db.OrderItem, include: { model: db.Item } },
      ],
    });

    res.json(orders);
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Fetch all orders for the admin user
router.get('/allorders', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (user.Role.name !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const orders = await db.sequelize.query(
      `SELECT Orders.id, Orders.status, Orders.createdAt, Users.firstName, Users.lastName, Items.name AS itemName
       FROM Orders
       INNER JOIN Users ON Orders.UserId = Users.id
       INNER JOIN OrderItems ON Orders.id = OrderItems.OrderId
       INNER JOIN Items ON OrderItems.ItemId = Items.id`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    res.json(orders);
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

