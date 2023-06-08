const express = require('express');
const router = express.Router();
const db = require('../models/db');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// GET /allcarts
router.get('/allcarts', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (req.authError) {
      return res.status(401).json({ message: req.authError });
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

//Get /categories
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

// GET orders 
router.get('/orders', authenticateToken, async (req, res) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }
  try {
    const user = req.user;

    const orders = await db.Order.findAll({
      where: { UserId: user.id },
      include: [
        {
          model: db.User,
          attributes: ['firstName', 'lastName', 'username'],
        },
        {
          model: db.OrderItem,
          attributes: ['id', 'quantity'],
          include: {
            model: db.Item,
            attributes: ['id', 'sku', 'name', 'price', 'stock', 'img_url'],
            include: {
              model: db.Category,
              attributes: ['id', 'name'],
            },
          },
        },
      ],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    const processedOrders = orders.map((order) => {
      if (order.status === 'Completed') {
        // Processed order
        return {
          id: order.id,
          status: order.status,
          User: {
            firstName: order.User.firstName,
            lastName: order.User.lastName,
          },
          OrderItems: order.OrderItems.map((orderItem) => {
            return {
              id: orderItem.id,
              quantity: orderItem.quantity,
              Item: {
                id: orderItem.Item.id,
                sku: orderItem.Item.sku,
                name: orderItem.Item.name,
                price: orderItem.Item.price,
                stock: orderItem.Item.stock,
                img_url: orderItem.Item.img_url,
                Category: {
                  id: orderItem.Item.Category.id,
                  name: orderItem.Item.Category.name,
                },
              },
            };
          }),
          statusInfo: 'Your order has been completed.',
        };
      } else {

        let statusInfo;
        let orderItemsInfo;
    
        if (order.status === 'In Process') {
          statusInfo = 'Your order is currently In Process.';
          orderItemsInfo = order.OrderItems.map((orderItem) => {
            return {
              itemName: orderItem.Item.name,
              quantity: orderItem.quantity,
              price: orderItem.Item.price,
            };
          });
        } else if (order.status === 'Cancelled') {
          statusInfo = 'Your order has been cancelled.';
          orderItemsInfo = order.OrderItems.map((orderItem) => {
            return {
              itemName: orderItem.Item.name,
              quantity: orderItem.quantity,
              price: orderItem.Item.price,
            };
          });
        }
    
        return {
          id: order.id,
          status: order.status,
          User: {
            firstName: order.User.firstName,
            lastName: order.User.lastName,
          },
          statusInfo: statusInfo,
          OrderItemsInfo: orderItemsInfo,
        };
      }
    });
    res.json(processedOrders);
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: err.message });
  }
});



// GET all orders
router.get('/allorders', authenticateToken, isAdmin, async (req, res) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }
  try {
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

