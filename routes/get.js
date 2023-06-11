const express = require('express');
const router = express.Router();
const db = require('../models/db');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');
const { sequelize } = require('../models/db');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


//GET allcarts
router.get('/allcarts', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (req.authError) {
      return res.status(401).json({ message: req.authError });
    }

    const query = `
      SELECT
        carts.id AS cartId,
        users.firstName,
        users.lastName,
        items.id AS itemId,
        items.sku,
        items.name,
        cartItems.originalPrice,
        items.stock,
        items.img_url,
        cartItems.quantity,
        cartItems.purchasePrice,
        cartItems.totalPrice,
        cartItems.moneySaved
      FROM
        carts
        JOIN users ON carts.UserId = users.id
        JOIN cartItems ON carts.id = cartItems.CartId
        JOIN items ON cartItems.ItemId = items.id
    `;

    const result = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });

    const carts = {};

    result.forEach((row) => {
      const { cartId, firstName, lastName, itemId, sku, name, originalPrice, stock, img_url, quantity, purchasePrice, totalPrice, moneySaved } = row;

      if (!carts[cartId]) {
        carts[cartId] = {
          id: cartId,
          user: {
            firstName,
            lastName,
          },
          items: [],
        };
      }

      carts[cartId].items.push({
        id: itemId,
        sku,
        name,
        originalPrice,
        stock,
        img_url,
        quantity,
        purchasePrice,
        totalPrice,
        moneySaved,
      });
    });

    res.json(Object.values(carts));
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

    const items = await db.Item.findAll({
      attributes: ['name', 'price', 'stock'],
      include: db.Category
    });

    const filteredItems = items.filter(item => {
      if (!user) {
        return item.stock > 0;
      }

      return true;
    });

    res.json(filteredItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//GET orders  
router.get('/orders', authenticateToken, async (req, res) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }
  try {
    const user = req.user;

    let orders;
    if (req.isAdmin) {
      orders = await db.Order.findAll({
        include: [
          {
            model: db.User,
            attributes: ['firstName', 'lastName', 'username'],
          },
          {
            model: db.OrderItem,
            attributes: ['id', 'quantity', 'totalPrice'],
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
    } else {
      orders = await db.Order.findAll({
        where: { UserId: user.id },
        include: [
          {
            model: db.User,
            attributes: ['firstName', 'lastName', 'username'],
          },
          {
            model: db.OrderItem,
            attributes: ['id', 'quantity', 'totalPrice'],
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
    }

    const processedOrders = orders.map((order) => {
      if (order.status === 'Completed') {
        return {
          id: order.id,
          status: order.status,
          User: {
            firstName: order.User.firstName,
            lastName: order.User.lastName,
          },
          OrderItemsInfo: order.OrderItems.map((orderItem) => {
            return {
              id: orderItem.id,
              quantity: orderItem.quantity,
              Item: {
                id: orderItem.Item.id,
                name: orderItem.Item.name,
                price: orderItem.Item.price,
              },
              totalPrice: orderItem.totalPrice,
              moneySaved: orderItem.totalPrice - (orderItem.Item.price * orderItem.quantity),
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
              id: orderItem.id,
              quantity: orderItem.quantity,
              Item: {
                id: orderItem.Item.id,
                sku: orderItem.Item.sku,
                name: orderItem.Item.name,
                price: orderItem.Item.price,
                stock: orderItem.Item.stock,
                img_url: orderItem.Item.img_url,
              },
              totalPrice: orderItem.totalPrice,
              moneySaved: orderItem.totalPrice - (orderItem.Item.price * orderItem.quantity),
            };
          });
        } else if (order.status === 'Cancelled') {
          statusInfo = 'Your order has been cancelled.';
          orderItemsInfo = order.OrderItems.map((orderItem) => {
            return {
              id: orderItem.id,
              quantity: orderItem.quantity,
              Item: {
                id: orderItem.Item.id,
                name: orderItem.Item.name,
                price: orderItem.Item.price,
                stock: orderItem.Item.stock,
              },
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

